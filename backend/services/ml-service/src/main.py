"""FastAPI app entry point.

Lifespan auto-trains both models on startup if the joblib artefacts are missing,
which means a clean Docker container boots ready to serve predictions. Set
``ML_DATA_MODE`` in env to flip between demo/live at any time — the routers read
the value per request.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from .config import get_settings
from .models.persistence import model_exists
from .models.train import train_all
from .routers import health, predict, train

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("ml-service")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Auto-train on cold start when artefacts are missing."""
    settings = get_settings()
    logger.info(
        "Starting ml-service (data_mode=%s, model_dir=%s)",
        settings.data_mode,
        settings.model_dir,
    )
    if not (model_exists("dropout_v1") and model_exists("placement_v1")):
        logger.info("Model artefacts missing — running initial training.")
        summary = train_all()
        logger.info("Initial training complete: %s", summary)
    else:
        logger.info("Model artefacts found — skipping initial training.")
    yield
    logger.info("Shutting down ml-service.")


def create_app() -> FastAPI:
    """Application factory. Used by uvicorn and the test suite."""
    app = FastAPI(
        title="Neural ERP ML Service",
        version="0.1.0",
        description=(
            "Predicts dropout risk and placement probability for students. "
            "Every response includes the disclosure 'AI-generated — review before saving.'"
        ),
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(predict.router)
    app.include_router(train.router)
    return app


app = create_app()
