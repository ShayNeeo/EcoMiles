"""Vietnam urban truck restriction overlay.

Implements legal truck restriction rules based on HCMC Decision 23/2018/QD-UBND:
- Light trucks (< 2.5T / xe_tai_nho): Prohibited from 06:00-09:00 and 16:00-20:00
  within the inner city ring corridor.
- Heavy trucks (>= 2.5T / xe_tai_nang): Prohibited from 06:00-22:00
  within the inner city ring corridor (permitted only 22:00-06:00).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import time
from typing import Literal

RestrictionSource = Literal["LAW_DECISION_23", "MUNICIPAL_NOTICE", "DRIVER_FEEDBACK", "MAP_TAG"]
ConfidenceTier = Literal["A_LEGAL", "B_VERIFIED_MAP", "C_PARTNER", "D_REPORT"]


@dataclass(frozen=True)
class RestrictionRule:
    rule_id: str
    name: str
    vehicle_class: str
    start_time: time
    end_time: time
    source: RestrictionSource = "LAW_DECISION_23"
    confidence: ConfidenceTier = "A_LEGAL"
    legal_reference: str = "Quyet dinh 23/2018/QD-UBND TP.HCM"


# Standard HCMC Decision 23 restriction rules
HCMC_LIGHT_TRUCK_MORNING_BAN = RestrictionRule(
    rule_id="HCMC_BAN_LIGHT_AM",
    name="Giờ cấm tải sáng (Xe tải nhỏ < 2.5T)",
    vehicle_class="xe_tai_nho",
    start_time=time(6, 0),
    end_time=time(9, 0),
)

HCMC_LIGHT_TRUCK_EVENING_BAN = RestrictionRule(
    rule_id="HCMC_BAN_LIGHT_PM",
    name="Giờ cấm tải chiều (Xe tải nhỏ < 2.5T)",
    vehicle_class="xe_tai_nho",
    start_time=time(16, 0),
    end_time=time(20, 0),
)

HCMC_HEAVY_TRUCK_DAY_BAN = RestrictionRule(
    rule_id="HCMC_BAN_HEAVY_DAY",
    name="Giờ cấm tải ban ngày (Xe tải nặng >= 2.5T)",
    vehicle_class="xe_tai_nang",
    start_time=time(6, 0),
    end_time=time(22, 0),
)

ACTIVE_RULES: list[RestrictionRule] = [
    HCMC_LIGHT_TRUCK_MORNING_BAN,
    HCMC_LIGHT_TRUCK_EVENING_BAN,
    HCMC_HEAVY_TRUCK_DAY_BAN,
]


@dataclass(frozen=True)
class RestrictionCheckResult:
    is_restricted: bool
    matched_rule: RestrictionRule | None = None
    reason: str = ""
    penalty_cost: float = 0.0


def parse_time_str(val: str) -> time | None:
    """Parse 'HH:MM' string to datetime.time."""
    if not val:
        return None
    try:
        parts = val.strip().split(":")
        return time(int(parts[0]), int(parts[1]))
    except Exception:
        return None


def is_time_overlapping(start_a: time, end_a: time, start_b: time, end_b: time) -> bool:
    """Check if time interval [start_a, end_a] overlaps with [start_b, end_b]."""
    return max(start_a, start_b) < min(end_a, end_b)


def check_truck_ban(
    window_start: str,
    window_end: str,
    vehicle_class: str = "xe_tai_nho",
    *,
    in_inner_city: bool = True,
) -> RestrictionCheckResult:
    """Evaluate whether delivery time window violates urban truck restrictions."""
    if not in_inner_city:
        return RestrictionCheckResult(is_restricted=False)

    w_start = parse_time_str(window_start)
    w_end = parse_time_str(window_end)
    if w_start is None or w_end is None:
        return RestrictionCheckResult(is_restricted=False)

    v_class = "xe_tai_nang" if ("nang" in vehicle_class or "heavy" in vehicle_class) else "xe_tai_nho"

    for rule in ACTIVE_RULES:
        if rule.vehicle_class != v_class:
            continue
        if is_time_overlapping(w_start, w_end, rule.start_time, rule.end_time):
            return RestrictionCheckResult(
                is_restricted=True,
                matched_rule=rule,
                reason=f"Vi phạm {rule.name} [{rule.start_time.strftime('%H:%M')} - {rule.end_time.strftime('%H:%M')}] theo {rule.legal_reference}",
                penalty_cost=50.0,
            )

    return RestrictionCheckResult(is_restricted=False)


@dataclass
class DriverRestrictionFeedback:
    driver_id: str
    plate: str
    lat: float
    lng: float
    issue_type: Literal["road_closed", "height_barrier", "weight_limit", "unexpected_ban"]
    notes: str = ""
    status: Literal["pending_review", "verified", "rejected"] = "pending_review"
    id: str = ""


# In-memory driver feedback queue (T-03, CR-20260923-001).
#
# Feedback NEVER auto-mutates ACTIVE_RULES. Verified entries require a
# separate admin promotion step (not implemented — no auto-promotion path
# exists on purpose). Production persistence is a future migration; the
# in-memory list mirrors the telemetry precedent (no DB migration).
_FEEDBACK_QUEUE: list[DriverRestrictionFeedback] = []


def submit_feedback(
    driver_id: str,
    plate: str,
    lat: float,
    lng: float,
    issue_type: Literal["road_closed", "height_barrier", "weight_limit", "unexpected_ban"],
    notes: str = "",
) -> DriverRestrictionFeedback:
    """Queue one driver restriction report as pending_review."""
    import uuid

    entry = DriverRestrictionFeedback(
        driver_id=driver_id,
        plate=plate,
        lat=lat,
        lng=lng,
        issue_type=issue_type,
        notes=notes,
        status="pending_review",
        id=uuid.uuid4().hex[:12],
    )
    _FEEDBACK_QUEUE.append(entry)
    return entry


def list_pending() -> list[DriverRestrictionFeedback]:
    """Return queued entries still awaiting review."""
    return [f for f in _FEEDBACK_QUEUE if f.status == "pending_review"]


def verify_feedback(feedback_id: str, approved: bool) -> DriverRestrictionFeedback:
    """Transition a queued entry to verified (approved) or rejected.

    Never touches ACTIVE_RULES — admin promotion is a separate manual step.
    Raises ValueError when the id is unknown.
    """
    for entry in _FEEDBACK_QUEUE:
        if entry.id == feedback_id:
            entry.status = "verified" if approved else "rejected"
            return entry
    raise ValueError(f"unknown feedback id: {feedback_id}")


def clear_feedback_queue() -> None:
    """Test helper: empty the in-memory queue."""
    _FEEDBACK_QUEUE.clear()
