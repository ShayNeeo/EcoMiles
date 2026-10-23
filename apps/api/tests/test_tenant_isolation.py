"""Tenant isolation proof, in-memory (T-LOOP-RBAC-HEALTH / CR-04 honest closure).

BLOCKED (honest TODO, no DB migration per brief): Route/Vehicle rows carry
no org column and demo AuthContext always resolves ``organization_id=
"org_demo"``, so true multi-tenant enforcement needs membership tables
(``org_members(user_id, org_id)`` + ``vehicle_orgs(plate, org_id)``) and a
resolver that reads them. What this module DOES prove: the helper logic —
same plate string in a different org -> 403 via ``verify_tenant_plate_access``
before plate logic ever runs; manager of OrgA cannot cross into OrgB through
the tenant helper even though legacy plate-scoped ``verify_driver_plate_access``
alone lets any manager anywhere (single-org demo bypass, preserved).

No JWT/Argon2 invented. No solver/places changes.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from greenlogix_api.auth.dependencies import (
    verify_driver_plate_access,
    verify_org_access,
    verify_tenant_plate_access,
)
from greenlogix_api.auth.models import AuthContext, UserRole


def _driver(org: str, plate: str | None = "51C-000.01") -> AuthContext:
    return AuthContext(
        user_id=f"driver_{org}_{plate or 'global'}",
        role=UserRole.DRIVER,
        organization_id=org,
        assigned_plate=plate,
    )


def _manager(org: str) -> AuthContext:
    return AuthContext(user_id=f"mgr_{org}", role=UserRole.MANAGER, organization_id=org)


def test_org_id_alias_defaults_to_org_demo() -> None:
    ctx = AuthContext(user_id="u", role=UserRole.DRIVER)
    assert ctx.organization_id == "org_demo"
    assert ctx.org_id == "org_demo"


def test_same_plate_different_org_is_403() -> None:
    """OrgA driver cannot access OrgB plate even with identical plate string."""
    org_a_driver = _driver("org_a", "51C-000.01")
    with pytest.raises(HTTPException) as exc:
        verify_tenant_plate_access(org_a_driver, "51C-000.01", target_org_id="org_b")
    assert exc.value.status_code == 403
    assert "organization" in exc.value.detail


def test_same_org_same_plate_passes() -> None:
    org_a_driver = _driver("org_a", "51C-000.01")
    verify_tenant_plate_access(org_a_driver, "51C-000.01", target_org_id="org_a")


def test_same_org_cross_plate_still_403_plate_scoped() -> None:
    """Org match but wrong plate -> plate logic still forbids (403)."""
    org_a_driver = _driver("org_a", "51C-000.01")
    with pytest.raises(HTTPException) as exc:
        verify_tenant_plate_access(org_a_driver, "51C-000.02", target_org_id="org_a")
    assert exc.value.status_code == 403


def test_manager_cross_org_is_403_via_tenant_helper() -> None:
    """Manager org-scoped: OrgA manager cannot reach OrgB tenant scope."""
    mgr_a = _manager("org_a")
    with pytest.raises(HTTPException) as exc:
        verify_tenant_plate_access(mgr_a, "ANY-PLATE", target_org_id="org_b")
    assert exc.value.status_code == 403


def test_manager_same_org_unrestricted_preserved() -> None:
    mgr_a = _manager("org_a")
    verify_tenant_plate_access(mgr_a, "ANY-PLATE", target_org_id="org_a")


def test_legacy_plate_helper_has_no_org_bypass_documented() -> None:
    """Documents the demo gap: plate-only helper lets any manager anywhere.

    This is the single-org demo bypass, intentionally preserved. The tenant
    helper above is the org-scoped path; DB-backed enforcement is BLOCKED
    on membership tables (see module docstring).
    """
    mgr_a = _manager("org_a")
    verify_driver_plate_access(mgr_a, "ANY-PLATE")  # no org concept here


def test_target_org_none_preserves_legacy_behavior() -> None:
    """Rows without an org column (None) keep legacy plate-only behavior."""
    org_a_driver = _driver("org_a", "51C-000.01")
    verify_org_access(org_a_driver, None)
    verify_tenant_plate_access(org_a_driver, "51C-000.01", target_org_id=None)
    with pytest.raises(HTTPException) as exc:
        verify_tenant_plate_access(org_a_driver, "51C-000.02", target_org_id=None)
    assert exc.value.status_code == 403
