from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AvailabilityTemplate(Base):
    __tablename__ = "availability_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    weekday: Mapped[int] = mapped_column(Integer, index=True)
    minutes_available: Mapped[int] = mapped_column(Integer, default=120)
    is_rest_day: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AvailabilityOverride(Base):
    __tablename__ = "availability_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    override_date: Mapped[date] = mapped_column(Date, index=True)
    minutes_available: Mapped[int] = mapped_column(Integer, default=0)
    is_rest_day: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)