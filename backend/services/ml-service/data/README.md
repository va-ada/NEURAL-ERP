# Synthetic ML Data

The `synthetic_v1.csv` file in this directory is **synthetic demo data — generated
programmatically by `src/data/synthetic.py` with `np.random.seed(42)`**.
It is **not** real student records and must not be relied on for any decision
that affects a real person.

The dataset has 500 rows and the following columns:

| column | type | range |
|---|---|---|
| `student_id` | string (UUID-like) | — |
| `attendance_pct` | float | 30..100 |
| `cgpa` | float | 2.5..10 |
| `grade_trend` | float | -1.5..+1.5 (slope) |
| `assignment_completion_pct` | float | 10..100 |
| `fee_paid_status` | int | 0 or 1 |
| `skills_count` | int | 0..15 |
| `internships_count` | int | 0..5 |
| `department` | string | one of CSE, ECE, ME, CE, EE |
| `dropout_label` | int | 0 or 1 (~12-18% prevalence) |
| `placed_label` | int | 0 or 1 (~65-75% prevalence) |

Regenerate with:

```bash
python -c "from src.data.synthetic import save_synthetic_csv; save_synthetic_csv()"
```
