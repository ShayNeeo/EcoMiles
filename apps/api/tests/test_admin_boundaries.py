from greenlogix_api.geo.admin_boundaries import (
    compute_route_admin_traversal,
    resolve_nearest_ward,
)


def test_resolve_nearest_ward():
    # Near Tan Binh Depot
    w1 = resolve_nearest_ward(10.8120, 106.6540)
    assert w1.district == "Tân Bình"

    # Near Le Duan, Q1
    w2 = resolve_nearest_ward(10.7810, 106.7000)
    assert w2.district == "Quận 1"
    assert "Bến Nghé" in w2.ward_name

def test_compute_route_admin_traversal_breadcrumb():
    stops = [
        {"id": 1, "lat": 10.8123, "lng": 106.6543},  # Tân Bình
        {"id": 2, "lat": 10.7940, "lng": 106.6730},  # Phú Nhuận
        {"id": 3, "lat": 10.7725, "lng": 106.6578},  # Quận 10
        {"id": 4, "lat": 10.7812, "lng": 106.6998},  # Quận 1
    ]

    traversal = compute_route_admin_traversal(stops, route_id=42)
    assert traversal.route_id == 42
    assert len(traversal.areas) == 4

    assert traversal.areas[0].district == "Tân Bình"
    assert traversal.areas[1].district == "Phú Nhuận"
    assert traversal.areas[2].district == "Quận 10"
    assert traversal.areas[3].district == "Quận 1"

    breadcrumb = traversal.district_breadcrumb
    assert breadcrumb == "Tân Bình → Phú Nhuận → Quận 10 → Quận 1"
