from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class StudyBlockOut(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    subject_color: str
    block_date: date
    starts_at: datetime
    ends_at: datetime
    minutes: int
    block_type: str
    status: str
    locked: bool
    order_index: int
    reason: str


class StudyBlockUpdate(BaseModel):
    status: Literal["planned", "completed", "missed"] | None = None
    locked: bool | None = None