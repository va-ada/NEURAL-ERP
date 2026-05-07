"""HTTP-level smoke tests using FastAPI's TestClient.

These tests train the models from scratch on first run (lifespan-driven) and
then exercise the public surface. The disclaimer string is asserted in every
prediction response — that's a contract our web/mobile clients depend on.
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Use a throwaway model dir so tests don't fight production artefacts.
TEST_MODEL_DIR = Path(__file__).resolve().parent / "_test_models"


@pytest.fixture(scope="module", autouse=True)
def _setup_env() -> None:
    os.environ["ML_DATA_MODE"] = "demo"
    os.environ["ML_MODEL_DIR"] = str(TEST_MODEL_DIR)
    os.environ["ML_ADMIN_TOKEN"] = "test-secret"
    if TEST_MODEL_DIR.exists():
        shutil.rmtree(TEST_MODEL_DIR)
    TEST_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    yield
    shutil.rmtree(TEST_MODEL_DIR, ignore_errors=True)


@pytest.fixture(scope="module")
def client() -> TestClient:
    from src.main import create_app
    app = create_app()
    with TestClient(app) as c:  # context manager triggers lifespan → trains models
        yield c


SAMPLE_FEATURES = {
    "attendance_pct": 50,
    "cgpa": 4.2,
    "grade_trend": -0.5,
    "assignment_completion_pct": 40,
    "fee_paid_status": 0,
    "skills_count": 2,
    "internships_count": 0,
    "department": "CSE",
}


def test_health(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_data_mode(client: TestClient) -> None:
    res = client.get("/health/data-mode")
    assert res.status_code == 200
    assert res.json() == {"dataMode": "demo"}


def test_predict_dropout_includes_disclosure(client: TestClient) -> None:
    res = client.post("/predict/dropout", json={"features": SAMPLE_FEATURES})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["disclaimer"] == "AI-generated — review before saving."
    assert 0 <= body["score"] <= 100
    assert 0 <= body["confidence"] <= 1
    assert body["modelVersion"] == "dropout_v1"
    assert body["dataMode"] == "demo"
    assert isinstance(body["topFactors"], list) and len(body["topFactors"]) <= 3
    for f in body["topFactors"]:
        assert "name" in f and "weight" in f


def test_predict_placement_includes_disclosure(client: TestClient) -> None:
    res = client.post("/predict/placement", json={"features": SAMPLE_FEATURES})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["disclaimer"] == "AI-generated — review before saving."
    assert body["modelVersion"] == "placement_v1"
    assert body["dataMode"] == "demo"


def test_predict_dropout_low_risk_features(client: TestClient) -> None:
    """High-CGPA + paid fees → low dropout score; sanity-check the model isn't inverted."""
    safe = {**SAMPLE_FEATURES, "attendance_pct": 95, "cgpa": 9.2, "fee_paid_status": 1,
            "assignment_completion_pct": 95, "grade_trend": 0.4}
    risky = SAMPLE_FEATURES
    safe_score = client.post("/predict/dropout", json={"features": safe}).json()["score"]
    risky_score = client.post("/predict/dropout", json={"features": risky}).json()["score"]
    assert safe_score < risky_score, f"safe={safe_score} risky={risky_score}"


def test_train_requires_admin_token(client: TestClient) -> None:
    res = client.post("/train")
    assert res.status_code == 401


def test_train_with_admin_token(client: TestClient) -> None:
    res = client.post("/train", headers={"X-ML-Admin-Token": "test-secret"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["trained"] == ["dropout_v1", "placement_v1"]
    assert "dropout" in body["roc_auc"] and "placement" in body["roc_auc"]


def test_batch_requires_admin_token(client: TestClient) -> None:
    res = client.post("/predict/batch", json={"student_ids": ["s1"]})
    assert res.status_code == 401


def test_batch_with_admin_token_demo_fallback(client: TestClient) -> None:
    res = client.post(
        "/predict/batch",
        json={"student_ids": ["s1", "s2"]},
        headers={"X-ML-Admin-Token": "test-secret"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["disclaimer"] == "AI-generated — review before saving."
    assert body["count"] == 2
    for entry in body["predictions"]:
        assert entry["dataMode"] == "demo"  # demo mode → neutral features
        assert entry["dropout"]["disclaimer"] == "AI-generated — review before saving."
        assert entry["placement"]["disclaimer"] == "AI-generated — review before saving."
