from datetime import date

from pydantic import BaseModel

from app.schemas.block import StudyBlockOut


class PreviewPlanRequest(BaseModel):
    start_date: date
    end_date: date


class GeneratePlanRequest(PreviewPlanRequest):
    pass


class PlannerWarning(BaseModel):
    code: str
    message: str


class PlannerPreview(BaseModel):
    blocks: list[StudyBlockOut]
    total_minutes: int
    warnings: list[PlannerWarning]