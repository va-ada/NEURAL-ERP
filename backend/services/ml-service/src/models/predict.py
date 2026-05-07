"""Inference: load joblib, score features, surface top-3 contributing factors."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from ..data.schema import StudentFeatures, TopFactor
from .persistence import load_model
from .train import ALL_FEATURES

logger = logging.getLogger(__name__)


_MODEL_CACHE: dict[str, Any] = {}


def _get_bundle(name: str) -> Any:
    """Load (and memoise) a trained bundle from disk."""
    if name not in _MODEL_CACHE:
        bundle = load_model(name)
        if bundle is None:
            raise RuntimeError(
                f"Model artefact '{name}.joblib' is missing. Hit /train (admin) "
                "or restart the service to auto-train."
            )
        _MODEL_CACHE[name] = bundle
    return _MODEL_CACHE[name]


def reset_cache() -> None:
    """Drop cached bundles. Called by /train after a fresh fit."""
    _MODEL_CACHE.clear()


def _confidence_from_proba(proba: float) -> float:
    """Confidence = distance from 0.5, scaled to [0, 1]. Symmetric around 0.5."""
    return float(round(abs(proba - 0.5) * 2, 4))


def _top_factors(bundle: Any, features: StudentFeatures, k: int = 3) -> list[TopFactor]:
    """Return the top-``k`` raw features ranked by permutation importance.

    Importance is global to the held-out test set, not per-instance. We weight
    it lightly by how far the student's value is from the dataset mean so the
    factor list reflects the individual case rather than a single static order.
    """
    importances: dict[str, float] = dict(bundle.importances)
    feats = features.model_dump()

    # Soft per-instance scaling: features that are extreme for this student get
    # a small boost so the surfaced factors feel relevant.
    scaled: list[tuple[str, float]] = []
    for name in ALL_FEATURES:
        importance = max(importances.get(name, 0.0), 0.0)
        if importance <= 0:
            continue
        # crude extremity score in [0, 1]
        extremity = 0.0
        if name == "attendance_pct":
            extremity = 1 - abs(float(feats[name]) - 75) / 75
        elif name == "cgpa":
            extremity = 1 - abs(float(feats[name]) - 7.0) / 7.0
        elif name == "fee_paid_status":
            extremity = 1.0 if int(feats[name]) == 0 else 0.3
        elif name == "skills_count":
            extremity = min(float(feats[name]) / 15, 1.0)
        elif name == "internships_count":
            extremity = min(float(feats[name]) / 5, 1.0)
        elif name == "assignment_completion_pct":
            extremity = 1 - abs(float(feats[name]) - 75) / 75
        elif name == "grade_trend":
            extremity = min(abs(float(feats[name])) / 1.5, 1.0)
        else:
            extremity = 0.5
        weighted = importance * (0.5 + 0.5 * max(0.0, extremity))
        scaled.append((name, round(float(weighted), 4)))

    scaled.sort(key=lambda kv: kv[1], reverse=True)
    return [TopFactor(name=n, weight=w) for n, w in scaled[:k]]


def predict_dropout(features: StudentFeatures) -> dict[str, Any]:
    """Run the dropout model and return a response-shaped dict."""
    bundle = _get_bundle("dropout_v1")
    df = pd.DataFrame([features.model_dump()])[ALL_FEATURES]
    proba = float(bundle.pipeline.predict_proba(df)[0, 1])
    return {
        "score": round(proba * 100, 2),
        "confidence": _confidence_from_proba(proba),
        "topFactors": [tf.model_dump() for tf in _top_factors(bundle, features)],
        "modelVersion": bundle.version,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def predict_placement(features: StudentFeatures) -> dict[str, Any]:
    """Run the placement model and return a response-shaped dict."""
    bundle = _get_bundle("placement_v1")
    df = pd.DataFrame([features.model_dump()])[ALL_FEATURES]
    proba = float(bundle.pipeline.predict_proba(df)[0, 1])
    return {
        "score": round(proba * 100, 2),
        "confidence": _confidence_from_proba(proba),
        "topFactors": [tf.model_dump() for tf in _top_factors(bundle, features)],
        "modelVersion": bundle.version,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
