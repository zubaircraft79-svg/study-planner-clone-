from datetime import datetime

from pydantic import BaseModel, Field


class StudySessionCreate(BaseModel):
    subject_id: int
    actual_minutes: int = Field(ge=1, le=1440)
    started_at: datetime
    completed_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=500)


class StudySessionOut(StudySessionCreate):
    id: int
    user_id: str
    source_block_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}