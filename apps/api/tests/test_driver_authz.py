"""Driver horizontal authorization: scoped PIN A-vs-B (T-CR04)."""

from __future__ import annotations

AUTH = {"Authorization": "Bearer DEMO"}
GLOBAL_PIN = {"X-Driver-Pin": "0000"}
JPEG = b"\xff\xd8\xff\xe0testjpeg"


def _seed_publish(demo_client):
    assert demo_client.post("/seed", headers=AUTH).status_code == 200
    assert (
        demo_client.post(
            "/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}
        ).status_code
        == 200
    )
    assert (
        demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []}).status_code
        == 200
    )
    routes = demo_client.get("/routes", headers=AUTH).json()
    assert len({r["plate"] for r in routes}) >= 2
    return routes


def _plates(routes):
    plates = sorted({r["plate"] for r in routes})
    return plates[0], plates[1]


def _stop_on_plate(routes, plate):
    for route in routes:
        if route["plate"] == plate:
            for stop in route["stops"]:
                if stop["kind"] == "stop":
                    return stop
    raise AssertionError(f"no stop on plate {plate}")


def test_scoped_driver_cross_plate_route_403(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, plate_b = _plates(routes)
    res = demo_client.get(
        "/driver/route",
        params={"plate": plate_b},
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
    )
    assert res.status_code == 403


def test_scoped_driver_own_plate_route_200(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, _ = _plates(routes)
    res = demo_client.get(
        "/driver/route",
        params={"plate": plate_a},
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
    )
    assert res.status_code == 200
    assert {r["plate"] for r in res.json()["routes"]} == {plate_a}


def test_scoped_driver_no_plate_sees_only_own(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, _ = _plates(routes)
    res = demo_client.get(
        "/driver/route", headers={"X-Driver-Pin": f"driver_{plate_a}"}
    )
    assert res.status_code == 200
    assert {r["plate"] for r in res.json()["routes"]} == {plate_a}


def test_scoped_driver_cross_plate_status_403(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, plate_b = _plates(routes)
    stop_b = _stop_on_plate(routes, plate_b)
    res = demo_client.post(
        f"/stops/{stop_b['id']}/status",
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
        json={"status": "arrived"},
    )
    assert res.status_code == 403


def test_scoped_driver_own_status_200(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, _ = _plates(routes)
    stop_a = _stop_on_plate(routes, plate_a)
    res = demo_client.post(
        f"/stops/{stop_a['id']}/status",
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
        json={"status": "arrived"},
    )
    assert res.status_code == 200


def test_scoped_driver_cross_plate_photo_403(demo_client) -> None:
    routes = _seed_publish(demo_client)
    plate_a, plate_b = _plates(routes)
    stop_b = _stop_on_plate(routes, plate_b)
    res = demo_client.post(
        f"/stops/{stop_b['id']}/photo",
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
        files={"photo": ("proof.jpg", JPEG, "image/jpeg")},
    )
    assert res.status_code == 403


def test_scoped_driver_missing_stop_stays_404(demo_client) -> None:
    _seed_publish(demo_client)
    routes = demo_client.get("/routes", headers=AUTH).json()
    plate_a, _ = _plates(routes)
    res = demo_client.post(
        "/stops/999999/status",
        headers={"X-Driver-Pin": f"driver_{plate_a}"},
        json={"status": "arrived"},
    )
    assert res.status_code == 404


def test_manager_unrestricted(demo_client) -> None:
    routes = _seed_publish(demo_client)
    _, plate_b = _plates(routes)
    res = demo_client.get("/driver/route", params={"plate": plate_b}, headers=AUTH)
    assert res.status_code == 200
    stop_b = _stop_on_plate(routes, plate_b)
    res = demo_client.post(
        f"/stops/{stop_b['id']}/status",
        headers=AUTH,
        json={"status": "arrived"},
    )
    assert res.status_code == 200


def test_global_0000_sees_all_plates(demo_client) -> None:
    routes = _seed_publish(demo_client)
    res = demo_client.get("/driver/route", headers=GLOBAL_PIN)
    assert res.status_code == 200
    assert {r["plate"] for r in res.json()["routes"]} == {r["plate"] for r in routes}
