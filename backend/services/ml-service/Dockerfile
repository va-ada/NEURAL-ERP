# syntax=docker/dockerfile:1.6
# ─── Stage 1 — builder ────────────────────────────────────
# We use 3.11 because scikit-learn ships prebuilt wheels for it; the local dev
# machine may be on 3.14 but the container is always 3.11 for predictability.
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ─── Stage 2 — runtime ────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ML_MODEL_DIR=/app/models

WORKDIR /app

# libgomp is needed by sklearn at runtime for openmp parallelism.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY . .

RUN mkdir -p /app/models /app/data

EXPOSE 3014

# Auto-trains on first boot via the lifespan hook.
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3014"]
