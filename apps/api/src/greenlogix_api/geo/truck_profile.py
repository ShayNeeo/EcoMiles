"""Heavy-duty and urban truck physical envelope profile for road routing."""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Any, Literal

log = logging.getLogger("greenlogix")

TruckClass = Literal["xe_tai_nho", "xe_tai_trung", "xe_tai_nang", "xe_van"]
FuelType = Literal["diesel", "petrol", "electric"]


@dataclass(frozen=True)
class TruckProfile:
    """Physical and legal vehicle envelope for truck-restricted routing."""

    name: str
    vehicle_class: TruckClass
    height_m: float
    width_m: float
    length_m: float
    gross_vehicle_weight_t: float
    empty_weight_kg: float
    max_payload_kg: float
    fuel_type: FuelType = "diesel"
    rated_l_per_100km: float = 11.5
    axle_load_t: float | None = None
    frontal_area_m2: float = 4.2
    cd: float = 0.65

    def to_valhalla_truck_options(self) -> dict[str, Any]:
        """Convert physical envelope to Valhalla truck costing parameters."""
        return {
            "height": round(self.height_m, 2),
            "width": round(self.width_m, 2),
            "length": round(self.length_m, 2),
            "weight": round(self.gross_vehicle_weight_t, 2),
            "axle_load": round(self.axle_load_t if self.axle_load_t is not None else (self.gross_vehicle_weight_t / 2.0), 2),
            "hazmat": False,
        }

    def profile_hash(self) -> str:
        """Deterministic short hash of the physical envelope for matrix cache keys."""
        spec = (
            f"{self.vehicle_class}:h{self.height_m:.2f}:w{self.width_m:.2f}:"
            f"l{self.length_m:.2f}:g{self.gross_vehicle_weight_t:.2f}"
        )
        return hashlib.sha256(spec.encode("utf-8")).hexdigest()[:12]


# Canonical presets for Vietnam urban freight fleet
XE_TAI_NHO_1T5 = TruckProfile(
    name="Xe tải nhỏ 1.5 Tấn (Hyundai Porter / Thaco Kia)",
    vehicle_class="xe_tai_nho",
    height_m=2.1,
    width_m=1.8,
    length_m=4.8,
    gross_vehicle_weight_t=3.2,
    empty_weight_kg=1700.0,
    max_payload_kg=1500.0,
    fuel_type="diesel",
    rated_l_per_100km=9.5,
    frontal_area_m2=3.8,
    cd=0.55,
)

XE_TAI_TRUNG_3T5 = TruckProfile(
    name="Xe tải trung 3.5 Tấn (Isuzu NPR / Hino 300)",
    vehicle_class="xe_tai_trung",
    height_m=2.8,
    width_m=2.1,
    length_m=6.2,
    gross_vehicle_weight_t=6.5,
    empty_weight_kg=3000.0,
    max_payload_kg=3500.0,
    fuel_type="diesel",
    rated_l_per_100km=13.5,
    frontal_area_m2=5.0,
    cd=0.65,
)

XE_TAI_NANG_8T = TruckProfile(
    name="Xe tải nặng 8 Tấn (Hino 500 / Dongfeng)",
    vehicle_class="xe_tai_nang",
    height_m=3.5,
    width_m=2.45,
    length_m=9.5,
    gross_vehicle_weight_t=14.0,
    empty_weight_kg=6000.0,
    max_payload_kg=8000.0,
    fuel_type="diesel",
    rated_l_per_100km=21.0,
    frontal_area_m2=6.8,
    cd=0.75,
)

DEFAULT_TRUCK_PROFILE = XE_TAI_NHO_1T5


def get_profile_for_vehicle(
    vehicle_type: str = "",
    capacity_kg: float = 0.0,
    fuel: str = "diesel",
    l_per_100km: float = 0.0,
    *,
    height_m: float | None = None,
    width_m: float | None = None,
    length_m: float | None = None,
    gvw_kg: float | None = None,
    axle_load_t: float | None = None,
    frontal_area_m2: float | None = None,
    cd: float | None = None,
) -> TruckProfile:
    """Infer appropriate TruckProfile from vehicle metadata.

    T-LOOP-ROUTING: never a silent fallback. An unknown/empty type with no
    capacity logs a warning and returns the explicit
    ``DEFAULT_TRUCK_PROFILE`` (xe_tai_nho envelope). Explicit physical
    dimensions (from additive ``Vehicle`` fields) override the preset
    envelope when all four are positive. Optional axle/aero overrides
    (``axle_load_t``/``frontal_area_m2``/``cd``) apply when positive;
    otherwise derived (axle gvw/2, area w*h, cd class preset).
    """
    v_norm = (vehicle_type or "").lower().strip()
    known = bool(v_norm) or (capacity_kg or 0) > 0
    if "nang" in v_norm or "heavy" in v_norm or (capacity_kg or 0) > 5000:
        base = XE_TAI_NANG_8T
    elif "trung" in v_norm or "medium" in v_norm or (capacity_kg or 0) > 2000:
        base = XE_TAI_TRUNG_3T5
    elif "van" in v_norm or "nho" in v_norm or "light" in v_norm or "small" in v_norm or known:
        base = XE_TAI_NHO_1T5
    else:
        log.warning(
            "get_profile_for_vehicle: unknown vehicle type=%r capacity_kg=%r; "
            "using explicit DEFAULT_TRUCK_PROFILE=%s (never silent)",
            vehicle_type,
            capacity_kg,
            DEFAULT_TRUCK_PROFILE.name,
        )
        return DEFAULT_TRUCK_PROFILE

    dims = (height_m, width_m, length_m, gvw_kg)
    if all(d is not None and d > 0 for d in dims):
        assert height_m is not None and width_m is not None
        assert length_m is not None and gvw_kg is not None
        return TruckProfile(
            name=f"{base.name} (measured envelope)",
            vehicle_class=base.vehicle_class,
            height_m=float(height_m),
            width_m=float(width_m),
            length_m=float(length_m),
            gross_vehicle_weight_t=float(gvw_kg) / 1000.0,
            empty_weight_kg=base.empty_weight_kg,
            max_payload_kg=float(capacity_kg) if (capacity_kg or 0) > 0 else base.max_payload_kg,
            fuel_type="petrol" if fuel == "petrol" else ("electric" if fuel == "electric" else "diesel"),
            rated_l_per_100km=float(l_per_100km) if (l_per_100km or 0) > 0 else base.rated_l_per_100km,
            axle_load_t=float(axle_load_t) if axle_load_t is not None and axle_load_t > 0 else None,
            frontal_area_m2=float(frontal_area_m2)
            if frontal_area_m2 is not None and frontal_area_m2 > 0
            else round(float(width_m) * float(height_m), 2),
            cd=float(cd) if cd is not None and cd > 0 else base.cd,
        )

    aero_override = (
        (axle_load_t is not None and axle_load_t > 0)
        or (frontal_area_m2 is not None and frontal_area_m2 > 0)
        or (cd is not None and cd > 0)
    )
    if l_per_100km > 0 or (fuel in ("diesel", "petrol", "electric") and fuel != base.fuel_type) or aero_override:
        return TruckProfile(
            name=base.name,
            vehicle_class=base.vehicle_class,
            height_m=base.height_m,
            width_m=base.width_m,
            length_m=base.length_m,
            gross_vehicle_weight_t=base.gross_vehicle_weight_t,
            empty_weight_kg=base.empty_weight_kg,
            max_payload_kg=max(capacity_kg, base.max_payload_kg) if capacity_kg > 0 else base.max_payload_kg,
            fuel_type="petrol" if fuel == "petrol" else ("electric" if fuel == "electric" else "diesel"),
            rated_l_per_100km=l_per_100km if l_per_100km > 0 else base.rated_l_per_100km,
            axle_load_t=float(axle_load_t)
            if axle_load_t is not None and axle_load_t > 0
            else base.axle_load_t,
            frontal_area_m2=float(frontal_area_m2)
            if frontal_area_m2 is not None and frontal_area_m2 > 0
            else base.frontal_area_m2,
            cd=float(cd) if cd is not None and cd > 0 else base.cd,
        )
    return base


def profile_for_vehicle_model(vehicle: Any) -> TruckProfile:
    """Build the per-vehicle TruckProfile for a ``Vehicle`` row/model.

    Reads additive envelope fields (``height_m``/``width_m``/``length_m``/
    ``gvw_kg``) when present and positive; otherwise infers from
    ``type``/``capacity_kg`` via :func:`get_profile_for_vehicle`. Optional
    additive axle/aero overrides (``axle_load_t``/``frontal_area_m2``/
    ``cd``) pass through when positive; otherwise derived. Uses
    ``getattr`` defaults so rows created before the additive migration
    still resolve (with an explicit logged default, never silent).
    """
    vtype = getattr(vehicle, "type", "") or ""
    capacity = getattr(vehicle, "capacity_kg", 0.0) or 0.0
    fuel = getattr(vehicle, "fuel", "diesel") or "diesel"
    l_per = getattr(vehicle, "l_per_100km", 0.0) or 0.0

    def _pos(name: str) -> float | None:
        try:
            val = getattr(vehicle, name, None)
        except Exception:
            return None
        return float(val) if val is not None and float(val) > 0 else None

    return get_profile_for_vehicle(
        vtype,
        capacity,
        fuel,
        l_per,
        height_m=_pos("height_m"),
        width_m=_pos("width_m"),
        length_m=_pos("length_m"),
        gvw_kg=_pos("gvw_kg"),
        axle_load_t=_pos("axle_load_t"),
        frontal_area_m2=_pos("frontal_area_m2"),
        cd=_pos("cd"),
    )
