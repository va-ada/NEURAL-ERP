"""Prediction endpoints.

Each handler resolves features (lookup vs raw), runs the relevant model, and
wraps the response in the disclosure envelope. Demo↔Live switching happens at
request time so an env flip is picked up without restart.
"""

from __future__ import annotations

import logging
from typing import Any, Callable

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import require_admin_token
from ..config import get_data_mode
from ..data.live import fetch_live_features
from ..data.schema import (
    BatchPredictRequest,
    PredictRequest,
    StudentFeatures,
)
from ..disclosure import wrap_disclosure
from ..models.predict import predict_dropout, predict_placement

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["predict"])


def _resolve_features(req: PredictRequest) -> tuple[StudentFeatures, str, str | None]:
    """Return (features, effective_data_mode, student_id_or_none).

    - If raw features were supplied, use them directly. Mode reflects current env.
    - If a student_id was supplied with mode=live, hit the DB. On miss, fall back
      to demo and signal it via ``demo-fallback``.
    - student_id with mode=demo → 400, since the synthetic CSV has random UUIDs
      that aren't useful for direct lookup. Caller should pass features.
    """
    if req.features is None and not req.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either 'features' or 'student_id'.",
        )

    mode = get_data_mode()

    if req.features is not None:
        return req.features, mode, req.student_id

    # student_id only ─ try a live lookup, otherwise reject in demo mode.
    if mode != "live":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "ML_DATA_MODE=demo cannot resolve student_id to features. "
                "Either pass 'features' directly or set ML_DATA_MODE=live."
            ),
        )
    feats = fetch_live_features(req.student_id)  # type: ignore[arg-type]
    if feats is None:
        # DB miss — degrade to demo with a fixed neutral feature vector and flag it.
        logger.warning(
            "Live lookup failed for %s; using demo-fallback neutral features.",
            req.student_id,
        )
        return (
            StudentFeatures(
                attendance_pct=75,
                cgpa=7.0,
                grade_trend=0.0,
                assignment_completion_pct=70,
                fee_paid_status=1,
                skills_count=4,
                internships_count=1,
                department="CSE",
            ),
            "demo-fallback",
            req.student_id,
        )
    return feats, "live", req.student_id


def _run(predictor: Callable[[StudentFeatures], dict[str, Any]], req: PredictRequest) -> dict[str, Any]:
    features, mode, student_id = _resolve_features(req)
    payload = predictor(features)
    payload["dataMode"] = mode
    if student_id is not None:
        payload["studentId"] = student_id
    return wrap_disclosure(payload)


@router.post("/dropout")
async def post_predict_dropout(req: PredictRequest) -> dict[str, Any]:
    """Predict dropout risk for one student."""
    return _run(predict_dropout, req)


@router.post("/placement")
async def post_predict_placement(req: PredictRequest) -> dict[str, Any]:
    """Predict placement probability for one student."""
    return _run(predict_placement, req)


@router.post("/batch", dependencies=[Depends(require_admin_token)])
async def post_predict_batch(req: BatchPredictRequest) -> dict[str, Any]:
    """Run dropout + placement for many student IDs.

    Admin-only (X-ML-Admin-Token header). In demo mode, this only works if you
    pre-populate features via the lookup; in practice the Node admin-service
    calls this in live mode. We degrade gracefully on per-student lookup misses.
    """
    mode = get_data_mode()
    results: list[dict[str, Any]] = []
    for sid in req.student_ids:
        if mode == "live":
            feats = fetch_live_features(sid)
        else:
            feats = None
        if feats is None:
            # demo or live-with-miss → neutral features + flag
            feats = StudentFeatures(
                attendance_pct=75,
                cgpa=7.0,
                grade_trend=0.0,
                assignment_completion_pct=70,
                fee_paid_status=1,
                skills_count=4,
                internships_count=1,
                department="CSE",
            )
            effective_mode = "demo-fallback" if mode == "live" else "demo"
        else:
            effective_mode = "live"

        dropout = predict_dropout(feats)
        placement = predict_placement(feats)
        for payload, key in ((dropout, "dropout"), (placement, "placement")):
            payload["dataMode"] = effective_mode
            payload["studentId"] = sid
        results.append({
            "studentId": sid,
            "dataMode": effective_mode,
            "dropout": wrap_disclosure(dropout),
            "placement": wrap_disclosure(placement),
        })

    return wrap_disclosure({
        "count": len(results),
        "dataMode": mode,
        "predictions": results,
    })
