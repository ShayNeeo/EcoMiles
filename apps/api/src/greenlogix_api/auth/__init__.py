"""Authentication and authorization package."""

from greenlogix_api.auth.dependencies import (
    get_current_auth,
    require_driver_role,
    require_manager_role,
    verify_driver_plate_access,
    verify_org_access,
    verify_tenant_plate_access,
)
from greenlogix_api.auth.legacy import (
    demo_enabled,
    require_dispatcher,
    require_driver,
)
from greenlogix_api.auth.models import AuthContext, UserRole
from greenlogix_api.auth.service import resolve_auth_context

__all__ = [
    "AuthContext",
    "UserRole",
    "demo_enabled",
    "get_current_auth",
    "require_dispatcher",
    "require_driver",
    "require_driver_role",
    "require_manager_role",
    "resolve_auth_context",
    "verify_driver_plate_access",
    "verify_org_access",
    "verify_tenant_plate_access",
]
