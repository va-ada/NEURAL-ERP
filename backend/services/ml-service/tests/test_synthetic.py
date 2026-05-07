"""Synthetic dataset properties.

These tests pin down the deterministic, plausible-but-fake nature of the
synthetic dataset. If a contributor accidentally drops the seed or rebalances
prevalence, these will catch it.
"""

from __future__ import annotations

import pandas as pd

from src.data.schema import DEPARTMENTS
from src.data.synthetic import generate_synthetic_dataset


def test_row_count_and_no_nulls() -> None:
    df = generate_synthetic_dataset(n=500, seed=42)
    assert len(df) == 500, "Synthetic dataset must have exactly 500 rows."
    assert df.isna().sum().sum() == 0, "Synthetic dataset must have no nulls."


def test_dropout_prevalence_in_band() -> None:
    df = generate_synthetic_dataset(n=500, seed=42)
    rate = df["dropout_label"].mean()
    assert 0.10 <= rate <= 0.20, f"dropout rate {rate:.3f} outside 0.10-0.20"


def test_placed_prevalence_in_band() -> None:
    df = generate_synthetic_dataset(n=500, seed=42)
    rate = df["placed_label"].mean()
    assert 0.60 <= rate <= 0.80, f"placed rate {rate:.3f} outside 0.60-0.80"


def test_deterministic_across_calls() -> None:
    a = generate_synthetic_dataset(n=500, seed=42)
    b = generate_synthetic_dataset(n=500, seed=42)
    pd.testing.assert_frame_equal(a, b)


def test_value_ranges() -> None:
    df = generate_synthetic_dataset(n=500, seed=42)
    assert df["attendance_pct"].between(0, 100).all()
    assert df["cgpa"].between(0, 10).all()
    assert df["grade_trend"].between(-1.5, 1.5).all()
    assert df["assignment_completion_pct"].between(0, 100).all()
    assert df["fee_paid_status"].isin([0, 1]).all()
    assert df["skills_count"].between(0, 15).all()
    assert df["internships_count"].between(0, 5).all()
    assert df["department"].isin(DEPARTMENTS).all()
