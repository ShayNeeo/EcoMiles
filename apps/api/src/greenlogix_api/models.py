"""SQLModel tables matching the frozen OpenAPI field names (D-15)."""

from __future__ import annotations

from sqlmodel import Field, SQLModel


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: int | None = Field(default=None, primary_key=True)
    address: str = ""
    lat: float = 0.0
    lng: float = 0.0
    receiver: str = ""
    phone: str = ""
    kg: float = 0.0
    window_start: str = ""
    window_end: str = ""
    cargo_type: str = "thuong"
    notes: str = ""
    excel_row: int | None = None
    status: str = "pending"
    # T-LOOP-GOFA (additive, nullable): place resolution provenance.
    # All Optional so existing rows/migrations are unaffected (None = unresolved).
    # Never invent GOFA base URL/auth/schema — see places/gofa.py BLOCKED note.
    place_id: str | None = Field(default=None)
    place_provider: str | None = Field(default=None)
    place_confidence: float | None = Field(default=None)
    geocode_at: str | None = Field(default=None)
    # C-03 (additive, nullable): caller-supplied external key. Re-uploads of the
    # same file skip rows whose external_id already exists instead of duplicating.
    external_id: str | None = Field(default=None, index=True)


class Vehicle(SQLModel, table=True):
    __tablename__ = "vehicles"

    id: int | None = Field(default=None, primary_key=True)
    plate: str = ""
    type: str = ""
    capacity_kg: float = 0.0
    fuel: str = "petrol"
    l_per_100km: float = 0.0
    status: str = "ready"
    # T-LOOP-ROUTING (additive, nullable): physical envelope for per-vehicle
    # TruckProfile inference. None = not recorded -> infer from type/capacity
    # with an explicit logged default, never a silent fallback.
    height_m: float | None = Field(default=None)
    width_m: float | None = Field(default=None)
    length_m: float | None = Field(default=None)
    gvw_kg: float | None = Field(default=None)
    # T-02 C-02 (additive, nullable): axle/aero overrides for TruckProfile.
    # None = not recorded -> derived (axle gvw/2, area w*h, cd class preset).
    # Rated consumption already covered by l_per_100km; powertrain coarsely
    # covered by fuel; emission_standard has no routing consumer (factors frozen).
    axle_load_t: float | None = Field(default=None)
    frontal_area_m2: float | None = Field(default=None)
    cd: float | None = Field(default=None)


class Route(SQLModel, table=True):
    __tablename__ = "routes"

    id: int | None = Field(default=None, primary_key=True)
    vehicle_id: int = 0
    plate: str = ""
    color: str = ""
    published: bool = False
    km: float = 0.0
    litres: float = 0.0
    kg_co2: float = 0.0
    overload: bool = False


class Stop(SQLModel, table=True):
    __tablename__ = "stops"

    id: int | None = Field(default=None, primary_key=True)
    route_id: int | None = Field(default=None, foreign_key="routes.id", index=True)
    seq: int = 0
    kind: str = "stop"
    order_id: int | None = None
    lat: float = 0.0
    lng: float = 0.0
    address: str = ""
    phone: str = ""
    window_start: str = ""
    window_end: str = ""
    notes: str = ""
    kg: float = 0.0
    status: str = "pending"
    fail_reason: str | None = None
