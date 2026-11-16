"""Vietnam urban truck restriction overlay.

Implements legal truck restriction rules based on HCMC Decision 23/2018/QD-UBND
(amended by Decision 23/2019/QD-UBND):
- Exempt vans (< 950 kg payload / xe_van, plus pickup trucks): Permitted 24/24h.
- Light trucks (<= 2.5T / xe_tai_nho, and converted vans >= 950 kg): Prohibited
  from 06:00-09:00 and 16:00-20:00 within the inner-city ring corridor (Art. 4).
- Heavy trucks (> 2.5T / xe_tai_trung, xe_tai_nang): Prohibited from 06:00-22:00
  within the inner-city ring corridor (permitted 22:00-06:00).
- Bounding ring highways and all outer-ring areas are 24/24h exempt (Art. 4.2).
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


# QĐ 23/2018/QĐ-UBND Art. 4 inner-city ring belt:
# QL1A (An Suong -> Binh Phuoc -> Tram 2) -> XLHN -> Mai Chi Tho ->
# Dong Van Cong -> Vo Chi Cong -> Phu My Bridge -> Elevated / Nguyen Van Linh -> QL1A.
# Art. 4.2 explicitly exempts the bounding ring corridors and outer areas.
HCMC_INNER_CITY_RING_POLYGON: tuple[tuple[float, float], ...] = (
    (10.8425, 106.6151),  # An Suong (QL1 x QL22)
    (10.8619, 106.6498),  # QL1 District 12
    (10.8628, 106.7186),  # Nga tu Binh Phuoc (QL1 x QL13)
    (10.8675, 106.7828),  # QL1 Linh Xuan
    (10.8661, 106.8022),  # Tram 2 / Suoi Tien (QL1 x XLHN)
    (10.8034, 106.7536),  # Xa lo Ha Noi x An Phu
    (10.7934, 106.7529),  # Cat Lai / Mai Chi Tho
    (10.7740, 106.7613),  # Mai Chi Tho x Dong Van Cong
    (10.7558, 106.7542),  # My Thuy (Dong Van Cong x Vo Chi Cong)
    (10.7452, 106.7453),  # Cau Phu My
    (10.7289, 106.7033),  # Nguyen Van Linh x Nguyen Huu Tho
    (10.7228, 106.6598),  # Nguyen Van Linh x Pham Hung
    (10.6909, 106.5950),  # Nguyen Van Linh x QL1 (Binh Chanh)
    (10.7495, 106.5939),  # QL1 x Kinh Duong Vuong (An Lac)
    (10.8150, 106.5968),  # QL1 x Le Trong Tan (Go May)
)


def is_in_hcmc_inner_city(lat: float, lng: float) -> bool:
    """Return True iff (lat, lng) lies strictly inside the QĐ 23/2018 inner-city ring."""
    inside = False
    n = len(HCMC_INNER_CITY_RING_POLYGON)
    for i in range(n):
        y1, x1 = HCMC_INNER_CITY_RING_POLYGON[i]
        y2, x2 = HCMC_INNER_CITY_RING_POLYGON[(i + 1) % n]
        if ((y1 > lat) != (y2 > lat)) and (lng < (x2 - x1) * (lat - y1) / (y2 - y1 + 1e-12) + x1):
            inside = not inside
    return inside


def _normalize_restriction_class(vehicle_class: str) -> str | None:
    """Map TruckClass to curfew tier, or None when legally 24/24h exempt."""
    vc = (vehicle_class or "").lower().strip()
    if vc == "xe_van":
        return None
    if "nang" in vc or "nặng" in vc or "heavy" in vc or "trung" in vc or "medium" in vc:
        return "xe_tai_nang"
    return "xe_tai_nho"


def _resolve_inner_city(
    in_inner_city: bool | None,
    lat: float | None,
    lng: float | None,
) -> bool:
    if in_inner_city is not None:
        return in_inner_city
    if lat is not None and lng is not None:
        return is_in_hcmc_inner_city(float(lat), float(lng))
    return True


def check_truck_ban(
    window_start: str,
    window_end: str,
    vehicle_class: str = "xe_tai_nho",
    *,
    in_inner_city: bool | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> RestrictionCheckResult:
    """Evaluate whether delivery time window overlaps urban truck restrictions."""
    if not _resolve_inner_city(in_inner_city, lat, lng):
        return RestrictionCheckResult(is_restricted=False)

    v_class = _normalize_restriction_class(vehicle_class)
    if v_class is None:
        return RestrictionCheckResult(is_restricted=False)

    w_start = parse_time_str(window_start)
    w_end = parse_time_str(window_end)
    if w_start is None or w_end is None:
        return RestrictionCheckResult(is_restricted=False)

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


def feasible_service_window(
    window_start: str,
    window_end: str,
    vehicle_class: str = "xe_tai_nho",
    *,
    in_inner_city: bool | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> tuple[int, int] | None:
    """Return legal non-curfew (start_min, end_min) sub-window, or None if 100% banned."""
    w_start = parse_time_str(window_start)
    w_end = parse_time_str(window_end)
    if w_start is None or w_end is None:
        return (480, 1020)
    s_min = w_start.hour * 60 + w_start.minute
    e_min = w_end.hour * 60 + w_end.minute
    if e_min <= s_min:
        return None

    if not _resolve_inner_city(in_inner_city, lat, lng):
        return (s_min, e_min)

    v_class = _normalize_restriction_class(vehicle_class)
    if v_class is None:
        return (s_min, e_min)

    intervals: list[tuple[int, int]] = [(s_min, e_min)]
    for rule in ACTIVE_RULES:
        if rule.vehicle_class != v_class:
            continue
        b_s = rule.start_time.hour * 60 + rule.start_time.minute
        b_e = rule.end_time.hour * 60 + rule.end_time.minute
        next_intervals: list[tuple[int, int]] = []
        for a, b in intervals:
            if b <= b_s or a >= b_e:
                next_intervals.append((a, b))
            else:
                if a < b_s:
                    next_intervals.append((a, b_s))
                if b > b_e:
                    next_intervals.append((b_e, b))
        intervals = next_intervals

    valid = [(a, b) for a, b in intervals if b - a >= 10]
    if not valid:
        return None
    # Prefer longest legal sub-window (ties broken by earliest start)
    best = max(valid, key=lambda iv: (iv[1] - iv[0], -iv[0]))
    return best


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
