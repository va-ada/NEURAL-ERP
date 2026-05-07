# Neural ERP — ML Service

Python 3.11 + FastAPI + scikit-learn microservice that predicts student dropout
risk and placement probability for the rest of the Neural ERP backend.

Every prediction response carries the disclosure
`"AI-generated — review before saving."` verbatim, plus `dataMode`,
`modelVersion`, `generatedAt`, top contributing factors, and a confidence score.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | — | Liveness probe |
| GET | `/health/data-mode` | — | Reports current `dataMode` |
| POST | `/predict/dropout` | — | `{ features }` or `{ student_id }` (live mode only) |
| POST | `/predict/placement` | — | Same shape |
| POST | `/predict/batch` | `X-ML-Admin-Token` | `{ student_ids: string[] }` |
| POST | `/train` | `X-ML-Admin-Token` | Re-trains both models |

## Demo vs Live

`ML_DATA_MODE` is read **at request time**, so flipping it doesn't require a
restart.

- `demo` — synthetic CSV (`data/synthetic_v1.csv`, generated deterministically).
- `live` — feature vectors assembled from the live Postgres tables via
  SQLAlchemy. If `DATABASE_URL` is unset/unreachable the service falls back to a
  neutral feature vector and surfaces `"dataMode": "demo-fallback"` so callers
  can show that to the user.

## Local development

Local Python is often 3.14, which doesn't have prebuilt scikit-learn wheels.
Recommended workaround:

```bash
brew install python@3.11
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

If you must run on Python 3.14 you can try the same install — `pip` may need to
compile scikit-learn from source which takes several minutes.

Once installed:

```bash
# train + persist models (also auto-runs on first uvicorn start)
python -c "from src.models.train import train_all; print(train_all())"

# run the service
uvicorn src.main:app --port 3014 --reload

# run the tests
pytest -q
```

The Node API gateway proxies `/api/predictions/*` to this service. The Node
admin-service calls `/predict/batch` for the dashboard widgets — set
`ML_ADMIN_TOKEN` in both `.env`s to the same string.

## Docker

```bash
docker build -t neural-erp/ml-service .
docker run --rm -p 3014:3014 \
  -e ML_DATA_MODE=demo \
  -e ML_ADMIN_TOKEN=change-me-shared-secret \
  -v $(pwd)/models:/app/models \
  neural-erp/ml-service
```

The container uses Python 3.11 (multi-stage build) regardless of host Python.

## Data

The synthetic dataset is **fake** — see `data/README.md`. The CSV format does
not allow header comments; the disclaimer lives in the README and the
`src/data/synthetic.py` module docstring instead.

## Versions

Pinned in `requirements.txt`:

- fastapi 0.115.5, uvicorn 0.32.1, pydantic 2.10.3
- scikit-learn 1.5.2 (3.13 wheels available; 3.11/3.12 wheels also exist)
- pandas 2.2.3, numpy 2.1.3
- SQLAlchemy 2.0.36, psycopg2-binary 2.9.10
- pytest 8.3.4
