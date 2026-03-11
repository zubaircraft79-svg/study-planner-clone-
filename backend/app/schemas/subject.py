from datetime import date, datetime

from pydantic import BaseModel, Field


class SubjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    exam_date: date | None = None
    difficulty: int = Field(ge=1, le=5)
    priority: int = Field(ge=1, le=5)
    required_minutes: int = Field(ge=30, le=100000)
    color: str = Field(default="#4F46E5", min_length=4, max_length=20)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    exam_date: date | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    priority: int | None = Field(default=None, ge=1, le=5)
    required_minutes: int | None = Field(default=None, ge=30, le=100000)
    color: str | None = Field(default=None, min_length=4, max_length=20)


class SubjectOut(SubjectBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}