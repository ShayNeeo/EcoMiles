from greenlogix_api.geo.restrictions import (
    check_truck_ban,
    feasible_service_window,
    is_in_hcmc_inner_city,
)


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


def test_van_under_950kg_exempt_24_7():
    res = check_truck_ban(
        window_start="07:30",
        window_end="08:30",
        vehicle_class="xe_van",
    )
    assert res.is_restricted is False


def test_medium_truck_over_2t5_subject_to_daytime_ban():
    res = check_truck_ban(
        window_start="13:00",
        window_end="15:00",
        vehicle_class="xe_tai_trung",
    )
    assert res.is_restricted is True
    assert res.matched_rule is not None
    assert res.matched_rule.rule_id == "HCMC_BAN_HEAVY_DAY"


def test_hcmc_outer_ring_exempt_under_qd23_art4():
    # District 12 north of QL1 (outside inner ring) vs District 1 (inside ring)
    assert is_in_hcmc_inner_city(10.8753, 106.6476) is False
    assert is_in_hcmc_inner_city(10.7765, 106.7008) is True

    outer_res = check_truck_ban("07:30", "08:30", "xe_tai_nho", lat=10.8753, lng=106.6476)
    assert outer_res.is_restricted is False

    inner_res = check_truck_ban("07:30", "08:30", "xe_tai_nho", lat=10.7765, lng=106.7008)
    assert inner_res.is_restricted is True


def test_feasible_service_window_trims_partial_ban_overlap():
    # 08:00-10:30 trims 06:00-09:00 ban -> 09:00-10:30 (540..630)
    assert feasible_service_window("08:00", "10:30", "xe_tai_nho", lat=10.7765, lng=106.7008) == (540, 630)
    # 14:30-16:30 trims 16:00-20:00 ban -> 14:30-16:00 (870..960)
    assert feasible_service_window("14:30", "16:30", "xe_tai_nho", lat=10.7765, lng=106.7008) == (870, 960)
    # 07:00-08:00 inside inner city leaves zero legal window
    assert feasible_service_window("07:00", "08:00", "xe_tai_nho", lat=10.7765, lng=106.7008) is None
    # Outer ring keeps full window
    assert feasible_service_window("07:00", "08:00", "xe_tai_nho", lat=10.8753, lng=106.6476) == (420, 480)


def test_hcmc_van_under_950kg_qcvn41_advisory_and_strict_mode():
    res_flex = check_truck_ban(
        "07:30",
        "08:30",
        "xe_van",
        lat=10.7765,
        lng=106.7008,
    )
    assert res_flex.is_restricted is False
    assert "QCVN 41:2024" in res_flex.street_sign_advisory
    assert "P.106a" in res_flex.street_sign_advisory
    assert "NĐ 168/2024" in res_flex.street_sign_advisory

    res_strict = check_truck_ban(
        "07:30",
        "08:30",
        "xe_van",
        lat=10.7765,
        lng=106.7008,
        strict_qcvn41_van=True,
    )
    assert res_strict.is_restricted is True


def test_hanoi_qd01_2026_gvw_ban_catches_16_seat_van():
    # Hanoi Hoan Kiem (inside Vanh Dai 3: 21.0285, 105.8542)
    # 16-seat stripped Transit/Solati <950kg payload has ~3.3T GVW (>= 2.0T): banned 06:00-21:00!
    res_van_hn = check_truck_ban(
        "10:00",
        "12:00",
        "xe_van",
        lat=21.0285,
        lng=105.8542,
        gvw_t=3.3,
    )
    assert res_van_hn.is_restricted is True
    assert res_van_hn.city_regime == "hanoi"
    assert res_van_hn.matched_rule is not None
    assert res_van_hn.matched_rule.rule_id == "HN_BAN_GE2T_DAY"
    assert feasible_service_window("10:00", "12:00", "xe_van", lat=21.0285, lng=105.8542, gvw_t=3.3) is None
    assert feasible_service_window("21:00", "23:00", "xe_van", lat=21.0285, lng=105.8542, gvw_t=3.3) == (1260, 1380)

    # Small micro-van GVW < 2.0T in Hanoi: banned 06:00-09:00 & 16:00-19:30, allowed midday
    res_micro_peak = check_truck_ban("07:30", "08:30", "xe_van", lat=21.0285, lng=105.8542, gvw_t=1.6)
    res_micro_mid = check_truck_ban("10:00", "12:00", "xe_van", lat=21.0285, lng=105.8542, gvw_t=1.6)
    assert res_micro_peak.is_restricted is True
    assert res_micro_mid.is_restricted is False

    # Outer Hanoi outside Vanh Dai 3 (e.g. Dong Anh / Noi Bai 21.18, 105.80) -> exempt
    res_outer_hn = check_truck_ban("10:00", "12:00", "xe_van", lat=21.1800, lng=105.8000, gvw_t=3.3)
    assert res_outer_hn.is_restricted is False
