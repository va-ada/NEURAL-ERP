"""Synthetic student dataset generator.

This is a *deterministic* fixture, not real student data. The CSV file format
does not allow header comments, so the disclaimer lives in this module's
docstring and in ``data/README.md``. Anything downstream that loads the CSV
should treat it as demo material — never as ground truth.

Plausible correlations baked in:
- Low attendance + low CGPA + low completion + unpaid fees → higher dropout odds.
- High CGPA + many skills + internships → higher placement odds.

Gaussian noise + clipping ensures the model has a non-trivial generalisation gap.
"""

from __future__ import annotations

import uuid
from pathlib import Path

import numpy as np
import pandas as pd

from .schema import DEPARTMENTS

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SYNTHETIC_CSV = DATA_DIR / "synthetic_v1.csv"


def generate_synthetic_dataset(n: int = 500, seed: int = 42) -> pd.DataFrame:
    """Generate ``n`` synthetic student rows.

    Parameters
    ----------
    n : int
        Number of rows. Defaults to 500.
    seed : int
        RNG seed. With the default of 42 the output is bit-for-bit reproducible.
    """
    rng = np.random.default_rng(seed)

    # Independent feature draws (truncated/clipped to plausible ranges).
    attendance_pct = np.clip(rng.normal(loc=78, scale=14, size=n), 30, 100)
    cgpa = np.clip(rng.normal(loc=7.2, scale=1.4, size=n), 2.5, 10.0)
    grade_trend = np.clip(rng.normal(loc=0.05, scale=0.55, size=n), -1.5, 1.5)
    assignment_completion_pct = np.clip(rng.normal(loc=72, scale=18, size=n), 10, 100)
    fee_paid_status = rng.choice([0, 1], size=n, p=[0.18, 0.82])
    skills_count = np.clip(rng.poisson(lam=4.2, size=n), 0, 15)
    internships_count = np.clip(rng.poisson(lam=0.9, size=n), 0, 5)
    department = rng.choice(DEPARTMENTS, size=n)
    # numpy's Generator.integers caps at int64; UUIDs need 128 bits, so we draw
    # 16 random bytes per row directly from the same rng for determinism.
    student_id = [
        str(uuid.UUID(bytes=bytes(rng.integers(0, 256, size=16, dtype=np.uint8))))
        for _ in range(n)
    ]

    # ── Dropout label ──────────────────────────────────────────────────
    # Higher when attendance/CGPA/completion are low and fees unpaid. Coefficients
    # were tuned (with seed 42) so prevalence sits at ~11% and a GBM clears AUC 0.80
    # on a 25% held-out split. Tighter noise = stronger signal but still imperfect.
    dropout_logit = (
        -0.7
        + (-0.10) * (attendance_pct - 70)         # below 70% attendance bumps risk
        + (-1.20) * (cgpa - 7.0)                  # below 7 CGPA bumps risk
        + (-0.04) * (assignment_completion_pct - 70)
        + (-2.00) * fee_paid_status               # paid fees strongly lowers risk
        + (-0.80) * grade_trend                   # negative slope bumps risk
        + rng.normal(0, 0.30, size=n)             # noise
    )
    dropout_prob = 1 / (1 + np.exp(-dropout_logit))
    dropout_label = (rng.uniform(0, 1, size=n) < dropout_prob).astype(int)

    # ── Placement label ─────────────────────────────────────────────────
    # Higher with strong CGPA, more skills, internships. Same tuning approach;
    # prevalence settles in the 60-80% band and RF clears AUC 0.80.
    placement_logit = (
        0.6
        + 1.10 * (cgpa - 7.0)
        + 0.32 * (skills_count - 4)
        + 0.95 * internships_count
        + 0.025 * (attendance_pct - 70)
        + rng.normal(0, 0.35, size=n)
    )
    placement_prob = 1 / (1 + np.exp(-placement_logit))
    placed_label = (rng.uniform(0, 1, size=n) < placement_prob).astype(int)

    df = pd.DataFrame({
        "student_id": student_id,
        "attendance_pct": np.round(attendance_pct, 2),
        "cgpa": np.round(cgpa, 2),
        "grade_trend": np.round(grade_trend, 3),
        "assignment_completion_pct": np.round(assignment_completion_pct, 2),
        "fee_paid_status": fee_paid_status.astype(int),
        "skills_count": skills_count.astype(int),
        "internships_count": internships_count.astype(int),
        "department": department,
        "dropout_label": dropout_label,
        "placed_label": placed_label,
    })

    # Sanity: prevalence within target bands. We don't raise on miss because the
    # tests assert this directly — keep generator pure of side effects.
    return df


def save_synthetic_csv(df: pd.DataFrame | None = None, path: Path | None = None) -> Path:
    """Persist the dataset to ``data/synthetic_v1.csv`` and return the path."""
    if df is None:
        df = generate_synthetic_dataset()
    target = path or SYNTHETIC_CSV
    target.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(target, index=False)
    return target


def load_synthetic_csv(path: Path | None = None) -> pd.DataFrame:
    """Load (or regenerate + persist) the synthetic CSV."""
    target = path or SYNTHETIC_CSV
    if not target.exists():
        df = generate_synthetic_dataset()
        save_synthetic_csv(df, target)
        return df
    return pd.read_csv(target)
