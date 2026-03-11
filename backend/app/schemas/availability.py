from datetime import date, datetime

from pydantic import BaseModel, Field


class AvailabilityTemplateBase(BaseModel):
    weekday: int = Field(ge=0, le=6)
    minutes_available: int = Field(ge=0, le=1440)
    is_rest_day: bool = False


class AvailabilityTemplateUpdate(AvailabilityTemplateBase):
    pass


class AvailabilityTemplateOut(AvailabilityTemplateBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AvailabilityOverrideCreate(BaseModel):
    override_date: date
    minutes_available: int = Field(ge=0, le=1440)
    is_rest_day: bool = False


class AvailabilityOverrideOut(BaseModel):
    id: int
    override_date: date
    minutes_available: int
    is_rest_day: bool
    created_at: datetime

    model_config = {"from_attributes": True}