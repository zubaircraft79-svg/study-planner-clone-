from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_subjects: int
    total_planned_minutes: int
    total_completed_minutes: int
    upcoming_exams: int
    completion_rate: float
    next_exam_subject: str | None = None
    next_exam_date: str | None = None