"""Lightweight shared-secret guard for admin endpoints.

The Node admin-service forwards ``X-ML-Admin-Token`` from its own env. We compare
in constant time to dodge trivial timing leaks. Not a substitute for mutual TLS
in production, but adequate for an internal service on a private network.
"""

from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, status

from .config import get_settings


def require_admin_token(x_ml_admin_token: str | None = Header(default=None)) -> None:
    """FastAPI dependency: 401 if the header doesn't match the configured secret."""
    expected = get_settings().admin_token
    if not x_ml_admin_token or not hmac.compare_digest(x_ml_admin_token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-ML-Admin-Token header.",
        )
