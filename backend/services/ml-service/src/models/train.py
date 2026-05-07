"""Train both models on the current data mode and persist them.

Dropout: pick the better of LogisticRegression vs GradientBoostingClassifier by
5-fold CV ROC-AUC.
Placement: RandomForestClassifier(n_estimators=200, random_state=42).

Both models live inside a ``Pipeline`` with a ``ColumnTransformer`` that one-hot
encodes ``department``. Permutation importance over the held-out test set gives
us the feature contributions returned by ``predict.py``.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ..data.synthetic import load_synthetic_csv
from .persistence import save_model

logger = logging.getLogger(__name__)

NUMERIC_FEATURES = [
    "attendance_pct",
    "cgpa",
    "grade_trend",
    "assignment_completion_pct",
    "fee_paid_status",
    "skills_count",
    "internships_count",
]
CATEGORICAL_FEATURES = ["department"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


@dataclass
class TrainedModel:
    """Bundle persisted with joblib so inference has everything it needs."""

    pipeline: Pipeline
    feature_names: list[str]
    importances: dict[str, float]
    roc_auc: float
    version: str


def _build_preprocessor() -> ColumnTransformer:
    """Numeric → standard scale; categorical → one-hot (handle unknowns)."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def _expanded_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    """Pull names through the fitted ColumnTransformer."""
    out: list[str] = []
    for name, trans, cols in preprocessor.transformers_:
        if name == "remainder":
            continue
        if hasattr(trans, "get_feature_names_out"):
            try:
                names = trans.get_feature_names_out(cols)
            except TypeError:
                names = trans.get_feature_names_out()
            out.extend(map(str, names))
        else:
            out.extend(cols)
    return out


def _permutation_importance(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    seed: int = 42,
) -> dict[str, float]:
    """Permutation importance keyed by *raw* (pre-encoding) feature names.

    We compute it on the raw frame so the API can surface human-readable factor
    names like ``attendance_pct`` instead of ``num__attendance_pct``.
    """
    result = permutation_importance(
        pipeline,
        X_test,
        y_test,
        n_repeats=8,
        random_state=seed,
        scoring="roc_auc",
        n_jobs=1,
    )
    importances = {
        name: float(round(result.importances_mean[i], 6))
        for i, name in enumerate(X_test.columns)
    }
    return importances


def _load_dataset() -> pd.DataFrame:
    """Always train on the synthetic CSV.

    Live training requires labelled outcomes (dropouts, placements) which we
    don't have a clean source for in the demo schema, so we explicitly use
    synthetic data even when ML_DATA_MODE=live. The /train endpoint exposes
    the current data mode in its response so the caller knows.
    """
    return load_synthetic_csv()


def train_dropout(seed: int = 42) -> TrainedModel:
    """Train the dropout model. Returns the trained bundle and persists it."""
    df = _load_dataset()
    X = df[ALL_FEATURES].copy()
    y = df["dropout_label"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=seed, stratify=y
    )

    pre = _build_preprocessor()

    # Two candidates; pick the higher 5-fold CV AUC.
    candidates: dict[str, Pipeline] = {
        "logreg": Pipeline([
            ("pre", pre),
            ("clf", LogisticRegression(max_iter=1000, random_state=seed, class_weight="balanced")),
        ]),
        "gbm": Pipeline([
            ("pre", _build_preprocessor()),
            ("clf", GradientBoostingClassifier(random_state=seed)),
        ]),
    }
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)

    cv_aucs: dict[str, float] = {}
    for name, pipe in candidates.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=1)
        cv_aucs[name] = float(np.mean(scores))
        logger.info("Dropout candidate %s 5-fold AUC=%.4f", name, cv_aucs[name])

    winner_name = max(cv_aucs, key=cv_aucs.get)  # type: ignore[arg-type]
    pipeline = candidates[winner_name]
    pipeline.fit(X_train, y_train)

    proba = pipeline.predict_proba(X_test)[:, 1]
    test_auc = float(roc_auc_score(y_test, proba))
    importances = _permutation_importance(pipeline, X_test, y_test, seed=seed)

    bundle = TrainedModel(
        pipeline=pipeline,
        feature_names=ALL_FEATURES,
        importances=importances,
        roc_auc=test_auc,
        version="dropout_v1",
    )
    save_model("dropout_v1", bundle)
    logger.info("Dropout model persisted (winner=%s, test AUC=%.4f)", winner_name, test_auc)
    return bundle


def train_placement(seed: int = 42) -> TrainedModel:
    """Train the placement model. Returns the trained bundle and persists it."""
    df = _load_dataset()
    X = df[ALL_FEATURES].copy()
    y = df["placed_label"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=seed, stratify=y
    )

    pipeline = Pipeline([
        ("pre", _build_preprocessor()),
        ("clf", RandomForestClassifier(n_estimators=200, random_state=seed, n_jobs=1)),
    ])
    pipeline.fit(X_train, y_train)

    proba = pipeline.predict_proba(X_test)[:, 1]
    test_auc = float(roc_auc_score(y_test, proba))
    importances = _permutation_importance(pipeline, X_test, y_test, seed=seed)

    bundle = TrainedModel(
        pipeline=pipeline,
        feature_names=ALL_FEATURES,
        importances=importances,
        roc_auc=test_auc,
        version="placement_v1",
    )
    save_model("placement_v1", bundle)
    logger.info("Placement model persisted (test AUC=%.4f)", test_auc)
    return bundle


def train_all(seed: int = 42) -> dict[str, Any]:
    """Train both models and return a summary suitable for the /train response."""
    dropout = train_dropout(seed=seed)
    placement = train_placement(seed=seed)
    return {
        "trained": [dropout.version, placement.version],
        "roc_auc": {
            "dropout": round(dropout.roc_auc, 4),
            "placement": round(placement.roc_auc, 4),
        },
    }
