"""Live-mode feature assembly from the Postgres tables.

Read-only. If ``DATABASE_URL`` is unset or unreachable, callers should fall back
to demo and surface ``demo-fallback`` in the response.

We use SQLAlchemy core (no ORM) so we don't have to stay in lockstep with the
Prisma schema — column-level changes won't break us as long as the names hold.
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from ..config import get_settings
from .schema import DEPARTMENTS, StudentFeatures

logger = logging.getLogger(__name__)


_engine: Engine | None = None


def _get_engine() -> Engine | None:
    """Lazy singleton. Returns None when DATABASE_URL is unset."""
    global _engine
    settings = get_settings()
    if not settings.database_url:
        return None
    if _engine is None:
        # ``+psycopg2`` so SQLAlchemy picks the binary driver we ship.
        url = settings.database_url
        if url.startswith("postgresql://") and "+psycopg2" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        _engine = create_engine(url, pool_pre_ping=True, future=True)
    return _engine


def _normalise_department(raw: str | None) -> str:
    """Map a department code to one the model has seen, fallback to CSE."""
    if not raw:
        return "CSE"
    code = raw.upper()
    return code if code in DEPARTMENTS else "CSE"


def fetch_live_features(student_id: str) -> StudentFeatures | None:
    """Assemble a feature vector for ``student_id`` from live tables.

    Returns None if the student doesn't exist or the DB is unreachable. The
    caller is responsible for falling back to demo.
    """
    engine = _get_engine()
    if engine is None:
        return None

    sql = text("""
        SELECT
            s.id AS student_id,
            d.code AS department,
            COALESCE(att.attendance_pct, 0) AS attendance_pct,
            COALESCE(sr.cgpa, 0) AS cgpa,
            COALESCE(sub.completion_pct, 0) AS assignment_completion_pct,
            COALESCE(skl.skills_count, 0) AS skills_count,
            COALESCE(fee.paid, 0) AS fee_paid_status,
            COALESCE(trend.grade_trend, 0) AS grade_trend,
            COALESCE(intern.cnt, 0) AS internships_count
        FROM students s
        JOIN departments d ON d.id = s."departmentId"
        LEFT JOIN LATERAL (
            SELECT
                CASE WHEN COUNT(*) = 0 THEN 0
                     ELSE 100.0 * SUM(CASE WHEN status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / COUNT(*)
                END AS attendance_pct
            FROM attendances a WHERE a."studentId" = s.id
        ) att ON true
        LEFT JOIN LATERAL (
            SELECT cgpa
            FROM semester_results sr
            WHERE sr."studentId" = s.id
            ORDER BY sr.semester DESC
            LIMIT 1
        ) sr ON true
        LEFT JOIN LATERAL (
            SELECT
                CASE WHEN COUNT(*) = 0 THEN 0
                     ELSE 100.0 * SUM(CASE WHEN sub."submittedAt" IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)
                END AS completion_pct
            FROM submissions sub WHERE sub."studentId" = s.id
        ) sub ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS skills_count
            FROM student_skills ss WHERE ss."studentId" = s.id
        ) skl ON true
        LEFT JOIN LATERAL (
            SELECT
                CASE WHEN COUNT(*) FILTER (WHERE status = 'PAID') > 0 THEN 1 ELSE 0 END AS paid
            FROM fees f WHERE f."studentId" = s.id
        ) fee ON true
        LEFT JOIN LATERAL (
            -- crude slope: latest semester points avg minus previous
            SELECT
                AVG(CASE WHEN g.semester = (SELECT MAX(semester) FROM grades WHERE "studentId" = s.id) THEN g.points END)
                - AVG(CASE WHEN g.semester < (SELECT MAX(semester) FROM grades WHERE "studentId" = s.id) THEN g.points END) AS grade_trend
            FROM grades g WHERE g."studentId" = s.id
        ) trend ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(DISTINCT co.company) AS cnt
            FROM career_applications ca
            JOIN career_opportunities co ON co.id = ca."opportunityId"
            WHERE ca."studentId" = s.id AND co.type ILIKE 'internship'
        ) intern ON true
        WHERE s.id = :student_id
        LIMIT 1
    """)

    try:
        with engine.connect() as conn:
            row = conn.execute(sql, {"student_id": student_id}).mappings().first()
    except Exception as exc:  # noqa: BLE001 — log and degrade
        logger.warning("Live DB read failed for student %s: %s", student_id, exc)
        return None

    if row is None:
        return None

    data: dict[str, Any] = dict(row)
    try:
        return StudentFeatures(
            attendance_pct=float(data["attendance_pct"]),
            cgpa=float(data["cgpa"]),
            grade_trend=max(min(float(data["grade_trend"] or 0.0), 1.5), -1.5),
            assignment_completion_pct=float(data["assignment_completion_pct"]),
            fee_paid_status=int(data["fee_paid_status"]),
            skills_count=int(data["skills_count"]),
            internships_count=int(data["internships_count"]),
            department=_normalise_department(data["department"]),  # type: ignore[arg-type]
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Live row→features coercion failed for %s: %s", student_id, exc)
        return None


def fetch_live_dataset() -> pd.DataFrame | None:
    """Pull every student's features for batch training in live mode.

    Returns None if DATABASE_URL is unset/unreachable. Currently used by
    /train when ML_DATA_MODE=live.
    """
    engine = _get_engine()
    if engine is None:
        return None

    # We re-run the per-student query as a set; for a real prod system you'd
    # rewrite this as a single query, but we keep it simple here.
    try:
        with engine.connect() as conn:
            ids = [r[0] for r in conn.execute(text("SELECT id FROM students"))]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Live DB student-id list failed: %s", exc)
        return None

    rows = []
    for sid in ids:
        feats = fetch_live_features(sid)
        if feats is None:
            continue
        d = feats.model_dump()
        d["student_id"] = sid
        # Without labelled data we cannot train. Live training is therefore not
        # supported end-to-end here — the API surfaces this by returning the
        # demo-trained models. We expose this for future supervised back-fill.
        rows.append(d)
    if not rows:
        return None
    return pd.DataFrame(rows)
