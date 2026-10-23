"""C-05 instance-loader tests: two public formats, Euclidean metric, clear errors."""

from __future__ import annotations

import pytest

from greenlogix_api.benchmark.instances import (
    FIXTURE_DIR,
    Customer,
    load_fixture,
    load_instance,
    parse_cvrplib,
    parse_solomon,
)

SOLOMON_BAD_ROW = """TINY
VEHICLE
NUMBER     CAPACITY
  2         200

CUSTOMER
CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE TIME

    0      40         50          0          0       1236          0
    1      45         68         10          0       1236          1 2
"""

def test_fixtures_are_self_authored_and_present() -> None:
    files = sorted(p.name for p in FIXTURE_DIR.glob("fixture-*.txt"))
    assert files == ["fixture-cvrplib-e5-k2.txt", "fixture-solomon-c1-5.txt"]

def test_solomon_fixture_fields() -> None:
    instance = load_fixture("fixture-solomon-c1-5.txt")
    assert instance.name == "C1-FIXTURE-5"
    assert instance.source_format == "solomon"
    assert instance.depot == (40.0, 50.0)
    assert instance.capacity == 200.0
    assert instance.vehicle_count == 2
    assert instance.time_windows is True
    assert instance.best_known is None  # never invented
    assert instance.n_customers == 5
    first = instance.customers[0]
    assert (first.id, first.x, first.y, first.demand, first.ready, first.due, first.service) == (
        1,
        45.0,
        68.0,
        10.0,
        0.0,
        1236.0,
        90.0,
    )

def test_solomon_metric_is_euclidean_not_haversine() -> None:
    instance = load_fixture("fixture-solomon-c1-5.txt")
    assert instance.distance_metric == "EUCLIDEAN"
    assert instance.dist((0.0, 0.0), (1.0, 0.0)) == 1.0  # haversine would be ~111 km
    assert instance.dist((0.0, 0.0), (3.0, 4.0)) == 5.0

def test_cvrplib_fixture_fields_and_nint_metric() -> None:
    instance = load_fixture("fixture-cvrplib-e5-k2.txt")
    assert instance.name == "fixture-e5-k2"
    assert instance.source_format == "cvrplib"
    assert instance.depot == (0.0, 0.0)
    assert instance.capacity == 20.0
    assert instance.vehicle_count == 2  # from VEHICLES header
    assert instance.time_windows is False
    assert instance.best_known == 46.0  # read from COMMENT, labelled "as authored"
    assert instance.distance_metric == "EUC_2D"
    assert [c.id for c in instance.customers] == [2, 3, 4, 5]
    assert instance.total_demand == 20.0
    assert instance.dist((0.0, 0.0), (10.0, 0.0)) == 10.0
    assert instance.dist((0.0, 0.0), (5.0, 5.0)) == 7.0  # nint(7.071) = int(d + 0.5)

def test_cvrplib_vehicle_count_falls_back_to_name_k_suffix() -> None:
    text = (
        "NAME : E-n5-k3\nTYPE : CVRP\nDIMENSION : 2\nCAPACITY : 10\n"
        "NODE_COORD_SECTION\n1 0 0\n2 1 1\nDEMAND_SECTION\n1 0\n2 1\n"
        "DEPOT_SECTION\n1\n-1\nEOF\n"
    )
    instance = parse_cvrplib(text)
    assert instance.vehicle_count == 3
    assert instance.name == "E-n5-k3"

def test_load_instance_sniffs_format_and_honours_explicit_fmt() -> None:
    solomon = FIXTURE_DIR / "fixture-solomon-c1-5.txt"
    cvrplib = FIXTURE_DIR / "fixture-cvrplib-e5-k2.txt"
    assert load_instance(solomon).source_format == "solomon"
    assert load_instance(cvrplib).source_format == "cvrplib"
    assert load_instance(solomon, fmt="solomon").source_format == "solomon"
    with pytest.raises(ValueError, match="unknown format"):
        load_instance(solomon, fmt="tsplib")

def test_load_instance_rejects_undetectable_file(tmp_path) -> None:
    path = tmp_path / "mystery.txt"
    path.write_text("hello\nworld\n")
    with pytest.raises(ValueError, match="cannot detect instance format"):
        load_instance(path)

def test_explicit_best_known_overrides_file() -> None:
    instance = load_fixture("fixture-cvrplib-e5-k2.txt", best_known=375.0)
    assert instance.best_known == 375.0

def test_solomon_parse_error_names_offending_line() -> None:
    with pytest.raises(ValueError) as excinfo:
        parse_solomon(SOLOMON_BAD_ROW, source="tiny.txt")
    message = str(excinfo.value)
    offending = SOLOMON_BAD_ROW.splitlines()[9]  # blank-separated blocks shift the rows
    assert not offending.strip().startswith("#")
    assert "tiny.txt: line 10" in message
    assert "customer row needs 7 fields" in message
    assert repr(offending.strip()) in message

def test_solomon_missing_vehicle_row_is_reported() -> None:
    text = "C101\nVEHICLE\nNUMBER CAPACITY\n\nCUSTOMER\n0 1 1 0 0 10 0\n"
    with pytest.raises(ValueError, match="VEHICLE block has no data row"):
        parse_solomon(text, source="partial.txt")

def test_cvrplib_dimension_mismatch_names_header_line() -> None:
    text = "NAME : bad\nDIMENSION : 9\nCAPACITY : 10\nNODE_COORD_SECTION\n1 0 0\n"
    with pytest.raises(ValueError) as excinfo:
        parse_cvrplib(text, source="bad.txt")
    assert "bad.txt: line 2" in str(excinfo.value)
    assert "DIMENSION 9 but 1 coordinate rows" in str(excinfo.value)

def test_cvrplib_missing_capacity_is_reported() -> None:
    text = "NAME : nocap\nNODE_COORD_SECTION\n1 0 0\n"
    with pytest.raises(ValueError, match="no CAPACITY header"):
        parse_cvrplib(text, source="nocap.txt")

def test_cvrplib_unsupported_section_and_edge_type_are_reported() -> None:
    section = "NAME : x\nCAPACITY : 10\nSERVICE_TIME_SECTION\n1 5\n"
    with pytest.raises(ValueError, match="unsupported section 'SERVICE_TIME_SECTION'"):
        parse_cvrplib(section, source="svc.txt")
    edge = "NAME : x\nCAPACITY : 10\nEDGE_WEIGHT_TYPE : GEO\nNODE_COORD_SECTION\n1 0 0\n"
    with pytest.raises(ValueError) as excinfo:
        parse_cvrplib(edge, source="geo.txt")
    assert "geo.txt: line 3" in str(excinfo.value)
    assert "unsupported EDGE_WEIGHT_TYPE 'GEO'" in str(excinfo.value)

def test_cvrplib_missing_demand_row_is_reported() -> None:
    text = "NAME : x\nCAPACITY : 10\nNODE_COORD_SECTION\n1 0 0\n2 1 1\nDEMAND_SECTION\n1 0\n"
    with pytest.raises(ValueError) as excinfo:
        parse_cvrplib(text, source="nodem.txt")
    assert "no row for node(s) [2]" in str(excinfo.value)

def test_cvrplib_missing_demand_section_is_reported() -> None:
    text = "NAME : nodemand\nCAPACITY : 10\nNODE_COORD_SECTION\n1 0 0\n2 1 1\n"
    with pytest.raises(ValueError) as excinfo:
        parse_cvrplib(text, source="nodemand.txt")
    message = str(excinfo.value)
    assert message.startswith("nodemand.txt: cannot parse CVRPLIB instance")
    assert "no DEMAND_SECTION" in message
    assert "cannot be defaulted" in message

def test_customer_point_helper() -> None:
    assert Customer(id=1, x=2.0, y=3.0, demand=1.0).point == (2.0, 3.0)
