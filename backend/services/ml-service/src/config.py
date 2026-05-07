"""Runtime settings.

Settings are read at request time (not cached as a module-level singleton) so
``ML_DATA_MODE`` can be flipped via env without restarting the process. The two
helpers ``get_data_mode()`` and ``get_settings()`` are the only public surface.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

DataMode = Literal["demo", "live"]


@dataclass(frozen=True)
class Settings:
    """Snapshot of env-driven config at the moment of the call."""

    data_mode: DataMode
    database_url: str | None
    model_dir: Path
    admin_token: str
    service_port: int


def _resolve_model_dir(raw: str | None) -> Path:
    """Resolve the model dir to an absolute path, creating it if missing."""
    default = Path(__file__).resolve().parent.parent / "models"
    path = Path(raw).expanduser().resolve() if raw else default
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_data_mode() -> DataMode:
    """Return the current data mode. ``demo`` unless explicitly set to ``live``."""
    raw = (os.getenv("ML_DATA_MODE") or "demo").strip().lower()
    return "live" if raw == "live" else "demo"


def get_settings() -> Settings:
    """Return a fresh ``Settings`` snapshot from current env."""
    return Settings(
        data_mode=get_data_mode(),
        database_url=os.getenv("DATABASE_URL") or None,
        model_dir=_resolve_model_dir(os.getenv("ML_MODEL_DIR")),
        admin_token=os.getenv("ML_ADMIN_TOKEN", "change-me-shared-secret"),
        service_port=int(os.getenv("ML_SERVICE_PORT", "3014")),
    )
