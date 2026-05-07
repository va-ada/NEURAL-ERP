"""Model quality on a held-out test split.

We require ROC-AUC ≥ 0.80 for both models. The synthetic data is designed with
strong-but-noisy correlations so this is a reasonable bar; if it slips below
the threshold something has changed in the generator or the training pipeline
and we want to know.
"""

from __future__ import annotations

from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from src.data.synthetic import generate_synthetic_dataset
from src.models.train import (
    ALL_FEATURES,
    _build_preprocessor,
)
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline


def _split(label: str):
    df = generate_synthetic_dataset(n=500, seed=42)
    X = df[ALL_FEATURES].copy()
    y = df[label].astype(int)
    return train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)


def test_dropout_auc_above_threshold() -> None:
    """Use GBM (the typical winner) directly to keep this fast."""
    X_train, X_test, y_train, y_test = _split("dropout_label")
    pipe = Pipeline([
        ("pre", _build_preprocessor()),
        ("clf", GradientBoostingClassifier(random_state=42)),
    ])
    pipe.fit(X_train, y_train)
    proba = pipe.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba)
    assert auc >= 0.80, f"Dropout ROC-AUC {auc:.3f} < 0.80"


def test_placement_auc_above_threshold() -> None:
    X_train, X_test, y_train, y_test = _split("placed_label")
    pipe = Pipeline([
        ("pre", _build_preprocessor()),
        ("clf", RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=1)),
    ])
    pipe.fit(X_train, y_train)
    proba = pipe.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba)
    assert auc >= 0.80, f"Placement ROC-AUC {auc:.3f} < 0.80"
