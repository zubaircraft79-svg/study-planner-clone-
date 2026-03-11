from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    session_minutes: Mapped[int] = mapped_column(Integer, default=50)
    short_break_minutes: Mapped[int] = mapped_column(Integer, default=10)
    long_break_minutes: Mapped[int] = mapped_column(Integer, default=20)
    long_break_every: Mapped[int] = mapped_column(Integer, default=3)
    day_start_hour: Mapped[int] = mapped_column(Integer, default=9)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)