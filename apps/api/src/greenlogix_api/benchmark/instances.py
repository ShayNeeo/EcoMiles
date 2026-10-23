"""Offline parsers for published VRP benchmark text formats (C-05 / WT-E).

Two formats are supported, both plain text, no network, no vendored data:

* **Solomon VRPTW** (``C1xx``/``R1xx`` style) — a ``VEHICLE`` block
  (``NUMBER CAPACITY``) followed by a ``CUSTOMER`` block whose rows are
  ``id x y demand ready due service`` (7 numeric fields; row 0 is the depot).
* **CVRPLIB CVRP** — ``NAME/COMMENT/TYPE/DIMENSION/EDGE_WEIGHT_TYPE/CAPACITY``
  headers, then ``NODE_COORD_SECTION`` / ``DEMAND_SECTION`` / ``DEPOT_SECTION``
  blocks, closed by ``EOF``.

Adding real instances
---------------------
Drop any real Solomon or CVRPLIB ``.txt`` file into ``apps/api/data/instances/``
(:data:`FIXTURE_DIR`) — the same directory as the self-authored ``fixture-*.txt``
files that ship with the repo. Nothing is downloaded and no third-party file is
vendored (licensing + offline tests), so that directory only ever contains the
fixtures; :func:`load_instance` sniffs the format from the file content, so a
real instance needs no filename convention. ``best_known`` is read from the file
(CVRPLIB ``COMMENT``) or passed by the caller — it is never invented and stays
``None`` when unknown, so a gap against it is never claimed without a source.

Distance metric
---------------
Both formats are planar coordinate sets, so benchmark distance is **Euclidean,
not haversine** (haversine describes degrees of lat/lng; the in-app solver keeps
it in ``solver.distance.road_km`` and is untouched here). Rounding follows
TSPLIB: ``EUC_2D`` (CVRPLIB) uses ``nint`` = ``int(d + 0.5)`` so objectives
match the published ones, while Solomon cost uses raw float Euclidean distance.
:meth:`Instance.dist` applies whichever the instance declares in
:attr:`Instance.distance_metric`.

Every parse failure raises :class:`ValueError` naming the offending line.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path

FIXTURE_DIR = Path(__file__).resolve().parents[3] / "data" / "instances"

_SOLOMON_KEYWORDS = {"VEHICLE", "CUSTOMER"}
_CVRP_SECTIONS = {
    "NODE_COORD_SECTION",
    "DEMAND_SECTION",
    "DEPOT_SECTION",
    "DISPLAY_DATA_SECTION",
    "EOF",
}
_BEST_KNOWN_RE = re.compile(r"best\s*[-_ ]?\s*known[^0-9]{0,24}(\d+(?:\.\d+)?)", re.IGNORECASE)
_VEHICLES_IN_NAME_RE = re.compile(r"-k(\d+)", re.IGNORECASE)

@dataclass(frozen=True)
class Customer:
    """One customer node: planar coordinates, demand and (optional) window."""

    id: int
    x: float
    y: float
    demand: float
    ready: float = 0.0
    due: float = 0.0
    service: float = 0.0

    @property
    def point(self) -> tuple[float, float]:
        return (self.x, self.y)

@dataclass(frozen=True)
class Instance:
    """A frozen benchmark instance, format-independent.

    ``vehicle_count`` is ``None`` when the file does not state it (the caller
    then decides — the loader never guesses a fleet size). ``time_windows`` is
    ``False`` for formats without them, so a window check is skipped rather than
    passed vacuously. ``best_known`` is ``None`` when no source supplied it.
    """

    name: str
    depot: tuple[float, float]
    customers: tuple[Customer, ...]
    capacity: float
    vehicle_count: int | None = None
    time_windows: bool = False
    best_known: float | None = None
    distance_metric: str = "EUCLIDEAN"
    source_format: str = "solomon"

    @property
    def n_customers(self) -> int:
        return len(self.customers)

    @property
    def total_demand(self) -> float:
        return sum(c.demand for c in self.customers)

    def dist(self, a: tuple[float, float], b: tuple[float, float]) -> float:
        """Euclidean distance between two points under this instance's metric."""
        d = math.dist(a, b)
        return float(int(d + 0.5)) if self.distance_metric == "EUC_2D" else d

def _fail(source: str, lineno: int, message: str, raw: str) -> ValueError:
    return ValueError(f"{source}: line {lineno}: {message}: {raw.strip()!r}")

def _floats(tokens: list[str]) -> list[float] | None:
    try:
        return [float(t) for t in tokens]
    except ValueError:
        return None

def parse_solomon(
    text: str,
    *,
    name: str | None = None,
    best_known: float | None = None,
    source: str = "<text>",
) -> Instance:
    """Parse a Solomon VRPTW-style instance. Raises ValueError on bad rows."""
    lines = text.splitlines()
    phase: str | None = None
    vehicle_block_seen = False
    vehicle_line: int | None = None
    vehicle_count: int | None = None
    capacity: float | None = None
    customers: list[Customer] = []
    seen_rows = False

    for lineno, raw in enumerate(lines, start=1):
        line = raw.strip()
        if not line:
            continue
        upper = line.upper()
        if upper in _SOLOMON_KEYWORDS:
            phase = upper.lower()
            if phase == "vehicle":
                vehicle_block_seen = True
            continue
        if phase is None:
            continue  # instance title / stray preamble
        tokens = line.replace(";", " ").split()
        nums = _floats(tokens)
        if phase == "vehicle":
            if vehicle_count is not None:
                continue
            if nums is None:
                if vehicle_line is not None:
                    raise _fail(source, lineno, "expected a numeric vehicle row", line)
                continue  # "NUMBER  CAPACITY" column header
            if len(nums) != 2:
                raise _fail(source, lineno, "vehicle row needs 2 fields (number capacity)", line)
            vehicle_line = lineno
            vehicle_count, capacity = int(nums[0]), float(nums[1])
            continue
        if nums is None:
            if seen_rows:
                raise _fail(source, lineno, "expected a numeric customer row", line)
            continue  # column header line
        if len(nums) != 7:
            raise _fail(
                source,
                lineno,
                f"customer row needs 7 fields (id x y demand ready due service), got {len(nums)}",
                line,
            )
        seen_rows = True
        customers.append(
            Customer(
                id=int(nums[0]),
                x=nums[1],
                y=nums[2],
                demand=nums[3],
                ready=nums[4],
                due=nums[5],
                service=nums[6],
            )
        )

    if capacity is None:
        detail = (
            "VEHICLE block has no data row" if vehicle_block_seen else "no VEHICLE block found"
        )
        raise ValueError(f"{source}: cannot parse Solomon instance — {detail}")
    if not customers:
        raise ValueError(f"{source}: cannot parse Solomon instance — no CUSTOMER rows found")

    depot = customers[0]
    return Instance(
        name=name or _solomon_title(lines, source),
        depot=(depot.x, depot.y),
        customers=tuple(customers[1:]),
        capacity=capacity,
        vehicle_count=vehicle_count,
        time_windows=True,
        best_known=best_known,
        distance_metric="EUCLIDEAN",
        source_format="solomon",
    )

def _solomon_title(lines: list[str], source: str) -> str:
    for raw in lines:
        line = raw.strip()
        if line and line.upper() not in _SOLOMON_KEYWORDS:
            return line
    return source

def parse_cvrplib(
    text: str,
    *,
    name: str | None = None,
    best_known: float | None = None,
    source: str = "<text>",
) -> Instance:
    """Parse a CVRPLIB CVRP instance. Raises ValueError on unsupported content."""
    headers: dict[str, tuple[str, int]] = {}
    coords: dict[int, tuple[float, float]] = {}
    demands: dict[int, float] = {}
    depot_ids: list[int] = []
    demand_section_line: int | None = None
    section: str | None = None

    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        upper = line.upper()
        if upper in _CVRP_SECTIONS:
            if upper == "EOF":
                break
            section = upper
            if upper == "DEMAND_SECTION":
                demand_section_line = lineno
            continue
        if section is not None:
            if section == "DISPLAY_DATA_SECTION":
                continue
            if _floats(line.split()) is None and upper.endswith("_SECTION"):
                raise _fail(source, lineno, f"unsupported section {line!r}", line)
            tokens = line.split()
            if section == "NODE_COORD_SECTION":
                if len(tokens) != 3:
                    raise _fail(source, lineno, "coordinate row needs 3 fields (id x y)", line)
                coords[int(tokens[0])] = (float(tokens[1]), float(tokens[2]))
            elif section == "DEMAND_SECTION":
                if len(tokens) != 2:
                    raise _fail(source, lineno, "demand row needs 2 fields (id demand)", line)
                demands[int(tokens[0])] = float(tokens[1])
            else:  # DEPOT_SECTION
                if len(tokens) != 1:
                    raise _fail(source, lineno, "depot row needs 1 field (node id)", line)
                depot_ids.append(int(tokens[0]))
            continue
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().upper()] = (value.strip(), lineno)
            continue
        if upper.endswith("_SECTION"):
            raise _fail(source, lineno, f"unsupported section {line!r}", line)
        raise _fail(source, lineno, "unexpected token outside a section", line)

    if not coords:
        raise ValueError(f"{source}: cannot parse CVRPLIB instance — no NODE_COORD_SECTION")
    if "CAPACITY" not in headers:
        raise ValueError(f"{source}: cannot parse CVRPLIB instance — no CAPACITY header")
    capacity = float(headers["CAPACITY"][0])

    dimension = _int_header(headers, "DIMENSION")
    if dimension is not None and dimension != len(coords):
        raise _fail(
            source,
            headers["DIMENSION"][1],
            f"DIMENSION {dimension} but {len(coords)} coordinate rows",
            headers["DIMENSION"][0],
        )

    edge_type = headers.get("EDGE_WEIGHT_TYPE", ("EUC_2D", 0))[0].upper()
    if edge_type not in {"EUC_2D", ""}:
        raise _fail(
            source,
            headers["EDGE_WEIGHT_TYPE"][1],
            f"unsupported EDGE_WEIGHT_TYPE {edge_type!r} (only EUC_2D is Euclidean)",
            headers["EDGE_WEIGHT_TYPE"][0],
        )

    if demand_section_line is None:
        raise ValueError(
            f"{source}: cannot parse CVRPLIB instance — no DEMAND_SECTION "
            "(demands cannot be defaulted to 0)"
        )

    missing = sorted(set(coords) - set(demands))
    if missing:
        raise _fail(
            source,
            demand_section_line,
            f"DEMAND_SECTION has no row for node(s) {missing}",
            f"DEMAND_SECTION (nodes {sorted(coords)})",
        )

    depot_id = next((d for d in depot_ids if d > 0), min(coords))
    if depot_id not in coords:
        raise ValueError(f"{source}: DEPOT_SECTION names node {depot_id} with no coordinates")

    customers = tuple(
        Customer(id=node, x=xy[0], y=xy[1], demand=demands.get(node, 0.0))
        for node, xy in sorted(coords.items())
        if node != depot_id
    )
    stated_name = headers.get("NAME", ("", 0))[0]
    comment = headers.get("COMMENT", ("", 0))[0]
    resolved_best = best_known if best_known is not None else _best_known_from(comment)
    return Instance(
        name=name or stated_name or source,
        depot=coords[depot_id],
        customers=customers,
        capacity=capacity,
        vehicle_count=_vehicle_count(headers, stated_name),
        time_windows=False,
        best_known=resolved_best,
        distance_metric="EUC_2D",
        source_format="cvrplib",
    )

def _int_header(headers: dict[str, tuple[str, int]], key: str) -> int | None:
    if key not in headers:
        return None
    try:
        return int(float(headers[key][0]))
    except ValueError:
        return None

def _vehicle_count(headers: dict[str, tuple[str, int]], stated_name: str) -> int | None:
    stated = _int_header(headers, "VEHICLES")
    if stated is not None:
        return stated
    match = _VEHICLES_IN_NAME_RE.search(stated_name)
    return int(match.group(1)) if match else None

def _best_known_from(comment: str) -> float | None:
    match = _BEST_KNOWN_RE.search(comment or "")
    return float(match.group(1)) if match else None

def load_instance(
    path: str | Path,
    *,
    fmt: str | None = None,
    best_known: float | None = None,
) -> Instance:
    """Load an instance file, sniffing the format unless ``fmt`` is given.

    ``fmt`` accepts ``"solomon"`` or ``"cvrplib"``. An unrecognised file raises
    ValueError rather than being parsed as something it is not.
    """
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    resolved = fmt.lower() if fmt else _sniff(text, file_path)
    if resolved == "solomon":
        return parse_solomon(text, best_known=best_known, source=str(file_path))
    if resolved == "cvrplib":
        return parse_cvrplib(text, best_known=best_known, source=str(file_path))
    raise ValueError(f"{file_path}: unknown format {resolved!r} (expected 'solomon' or 'cvrplib')")

def _sniff(text: str, file_path: Path) -> str:
    upper = text.upper()
    if "NODE_COORD_SECTION" in upper:
        return "cvrplib"
    if "VEHICLE" in upper and "CUSTOMER" in upper:
        return "solomon"
    raise ValueError(
        f"{file_path}: cannot detect instance format (no NODE_COORD_SECTION, "
        "no VEHICLE/CUSTOMER blocks) — pass fmt explicitly"
    )

def load_fixture(filename: str, **kwargs: object) -> Instance:
    """Load a file from :data:`FIXTURE_DIR` (the shipped ``fixture-*.txt`` set)."""
    return load_instance(FIXTURE_DIR / filename, **kwargs)  # type: ignore[arg-type]
