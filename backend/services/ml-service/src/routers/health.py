"""Liveness + data-mode probes."""

from __future__ import annotations

from fastapi import APIRouter

from ..config import get_data_mode

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Always returns ok; used by Docker/k8s liveness probes."""
    return {"status": "ok"}


@router.get("/health/data-mode")
async def data_mode() -> dict[str, str]:
    """Reports the *current* (env-time) data mode."""
    return {"dataMode": get_data_mode()}
