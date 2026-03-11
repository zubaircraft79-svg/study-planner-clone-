from datetime import datetime

from pydantic import BaseModel, Field


class PreferencesUpdate(BaseModel):
    session_minutes: int = Field(ge=20, le=180)
    short_break_minutes: int = Field(ge=0, le=60)
    long_break_minutes: int = Field(ge=0, le=120)
    long_break_every: int = Field(ge=1, le=10)
    day_start_hour: int = Field(ge=0, le=23)


class PreferencesOut(PreferencesUpdate):
    id: int
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}