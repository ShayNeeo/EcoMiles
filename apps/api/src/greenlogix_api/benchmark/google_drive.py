"""Google Drive connector — honest BLOCKED stub (CR-16 PARTIAL).

No live GPS, no Drive credentials, no invented routes: every entry point
raises NotImplementedError with a BLOCKED message. Never returns fake data.
"""

from __future__ import annotations

from typing import Any

_BLOCKED_MSG = (
    "BLOCKED: Google Drive connector not configured — no service-account "
    "credentials, no folder ID, no device smoke test. Wire credentials and "
    "a recorded fixture before enabling (see CR-16)."
)


def fetch_route_file(file_id: str) -> Any:
    """Download a route/trace file from Drive. Always raises (BLOCKED)."""
    raise NotImplementedError(f"{_BLOCKED_MSG} fetch_route_file(file_id={file_id!r}) refused.")


def upload_report(name: str, payload: bytes) -> Any:
    """Upload a report artifact to Drive. Always raises (BLOCKED)."""
    raise NotImplementedError(f"{_BLOCKED_MSG} upload_report(name={name!r}) refused.")


def list_files(folder_id: str) -> Any:
    """List files in a Drive folder. Always raises (BLOCKED)."""
    raise NotImplementedError(f"{_BLOCKED_MSG} list_files(folder_id={folder_id!r}) refused.")
