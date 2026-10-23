from greenlogix_api.geo.restrictions import check_truck_ban


def test_light_truck_morning_ban_violation():
    res = check_truck_ban(
        window_start="07:30",
        window_end="09:30",
        vehicle_class="xe_tai_nho",
    )
    assert res.is_restricted is True
    assert "Giờ cấm tải sáng" in res.reason
    assert res.matched_rule is not None
    assert res.matched_rule.rule_id == "HCMC_BAN_LIGHT_AM"

def test_light_truck_evening_ban_violation():
    res = check_truck_ban(
        window_start="17:00",
        window_end="18:30",
        vehicle_class="xe_tai_nho",
    )
    assert res.is_restricted is True
    assert "Giờ cấm tải chiều" in res.reason
    assert res.matched_rule is not None
    assert res.matched_rule.rule_id == "HCMC_BAN_LIGHT_PM"

def test_light_truck_midday_allowed():
    res = check_truck_ban(
        window_start="10:00",
        window_end="12:00",
        vehicle_class="xe_tai_nho",
    )
    assert res.is_restricted is False
    assert res.reason == ""

def test_heavy_truck_daytime_ban():
    # Light truck is allowed at 13:00-15:00
    res_light = check_truck_ban(
        window_start="13:00",
        window_end="15:00",
        vehicle_class="xe_tai_nho",
    )
    assert res_light.is_restricted is False

    # Heavy truck is prohibited all day 06:00-22:00
    res_heavy = check_truck_ban(
        window_start="13:00",
        window_end="15:00",
        vehicle_class="xe_tai_nang",
    )
    assert res_heavy.is_restricted is True
    assert "Xe tải nặng" in res_heavy.reason
