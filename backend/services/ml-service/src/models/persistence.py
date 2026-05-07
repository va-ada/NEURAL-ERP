"""joblib save/load helpers.

Models are written under ``Settings.model_dir``. Filenames are versioned
(`<name>_v1.joblib`) so we can roll a new model without breaking inference for
clients still on v1.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from ..config import get_settings


def model_path(name: str) -> Path:
    """Return ``<model_dir>/<name>.joblib`` resolved against current settings."""
    return get_settings().model_dir / f"{name}.joblib"


def save_model(name: str, payload: Any) -> Path:
    """Persist ``payload`` and return the file path."""
    path = model_path(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, path)
    return path


def load_model(name: str) -> Any | None:
    """Return the persisted payload, or None if it doesn't exist yet."""
    path = model_path(name)
    if not path.exists():
        return None
    return joblib.load(path)


def model_exists(name: str) -> bool:
    return model_path(name).exists()
