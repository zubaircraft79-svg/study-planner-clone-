from datetime import date

from pydantic import BaseModel


class SubjectProgressOut(BaseModel):
    subject_id: int
    subject_name: str
    color: str
    required_minutes: int
    completed_minutes: int
    remaining_minutes: int
    progress_percent: float
    exam_date: date | None