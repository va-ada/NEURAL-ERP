"""Pydantic request/response schemas.

The feature names map 1:1 onto the columns in the synthetic dataset and onto the
aggregations in ``data/live.py``. If you change a name here, change it in both.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# Department list mirrors the synthetic generator and live aggregation. Adding
# a new department requires re-training so the OneHotEncoder learns it.
DEPARTMENTS = ("CSE", "ECE", "ME", "CE", "EE")
DepartmentLiteral = Literal["CSE", "ECE", "ME", "CE", "EE"]


class StudentFeatures(BaseModel):
    """Numeric + categorical features for a single student."""

    attendance_pct: float = Field(..., ge=0, le=100, description="Attendance percentage 0..100")
    cgpa: float = Field(..., ge=0, le=10, description="Cumulative GPA 0..10")
    grade_trend: float = Field(..., ge=-1.5, le=1.5, description="Slope of recent grade points")
    assignment_completion_pct: float = Field(..., ge=0, le=100)
    fee_paid_status: int = Field(..., ge=0, le=1, description="1 = paid, 0 = unpaid")
    skills_count: int = Field(..., ge=0, le=15)
    internships_count: int = Field(..., ge=0, le=5)
    department: DepartmentLiteral


class PredictRequest(BaseModel):
    """Either pass a ``student_id`` (lookup) OR raw ``features`` (direct).

    At least one must be present. Validated in the router.
    """

    student_id: str | None = None
    features: StudentFeatures | None = None


class TopFactor(BaseModel):
    name: str
    weight: float


class PredictResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    topFactors: list[TopFactor]
    modelVersion: str
    dataMode: str
    generatedAt: datetime
    disclaimer: str
    studentId: str | None = None


class BatchPredictRequest(BaseModel):
    student_ids: list[str] = Field(..., min_length=1, max_length=500)


class TrainResponse(BaseModel):
    trained: list[str]
    roc_auc: dict[str, float]
    dataMode: str
