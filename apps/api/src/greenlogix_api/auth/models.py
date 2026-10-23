"""Auth and RBAC data structures."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class UserRole(str, Enum):
    MANAGER = "MANAGER"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    role: UserRole
    organization_id: str = "org_demo"
    assigned_plate: str | None = None

    @property
    def org_id(self) -> str:
        """Additive alias for ``organization_id`` (T-LOOP-RBAC-HEALTH).

        Single-org demo: every context defaults to ``"org_demo"``. No
        membership tables exist yet (no DB migration); tenant isolation is
        enforced in-memory by ``verify_org_access``. See BLOCKED note in
        ``tests/test_tenant_isolation.py``.
        """
        return self.organization_id

    @property
    def is_manager(self) -> bool:
        return self.role in (UserRole.MANAGER, UserRole.ADMIN)

    @property
    def is_driver(self) -> bool:
        return self.role == UserRole.DRIVER
