import pytest
from fastapi import HTTPException

from greenlogix_api.auth.dependencies import (
    require_driver_role,
    require_manager_role,
    verify_driver_plate_access,
)
from greenlogix_api.auth.models import AuthContext, UserRole


def test_manager_role_access():
    mgr = AuthContext(user_id="u1", role=UserRole.MANAGER)
    assert require_manager_role(mgr) == mgr

    driver = AuthContext(user_id="u2", role=UserRole.DRIVER)
    with pytest.raises(HTTPException) as exc:
        require_manager_role(driver)
    assert exc.value.status_code == 403

def test_driver_role_access():
    driver = AuthContext(user_id="u2", role=UserRole.DRIVER)
    assert require_driver_role(driver) == driver

    mgr = AuthContext(user_id="u1", role=UserRole.MANAGER)
    with pytest.raises(HTTPException) as exc:
        require_driver_role(mgr)
    assert exc.value.status_code == 403

def test_driver_horizontal_access_control():
    # Scoped to vehicle 51C-000.01
    driver_01 = AuthContext(
        user_id="d1",
        role=UserRole.DRIVER,
        assigned_plate="51C-000.01",
    )
    # Allowed on own plate
    verify_driver_plate_access(driver_01, "51C-000.01")

    # Forbidden on other vehicle plate
    with pytest.raises(HTTPException) as exc:
        verify_driver_plate_access(driver_01, "51C-000.02")
    assert exc.value.status_code == 403
    assert "not assigned" in exc.value.detail

def test_manager_unrestricted_plate_access():
    mgr = AuthContext(user_id="mgr", role=UserRole.MANAGER)
    # Manager can access any vehicle
    verify_driver_plate_access(mgr, "51C-000.01")
    verify_driver_plate_access(mgr, "51C-000.02")
    verify_driver_plate_access(mgr, "ANY-PLATE")
