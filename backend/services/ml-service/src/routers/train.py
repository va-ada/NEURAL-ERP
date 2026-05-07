"""Admin-only retraining endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth import require_admin_token
from ..config import get_data_mode
from ..data.schema import TrainResponse
from ..models import predict as predict_module
from ..models.train import train_all

router = APIRouter(tags=["train"], dependencies=[Depends(require_admin_token)])


@router.post("/train", response_model=TrainResponse)
async def post_train() -> TrainResponse:
    """Re-train both models and clear the inference cache.

    Always trains on the synthetic dataset because that's the only labelled
    data we have. The response surfaces ``dataMode`` so the caller knows what
    was used at training time.
    """
    summary = train_all()
    predict_module.reset_cache()
    return TrainResponse(
        trained=summary["trained"],
        roc_auc=summary["roc_auc"],
        dataMode=get_data_mode(),
    )
