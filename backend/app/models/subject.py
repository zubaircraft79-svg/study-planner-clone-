from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    exam_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    priority: Mapped[int] = mapped_column(Integer, default=3)
    required_minutes: Mapped[int] = mapped_column(Integer, default=600)
    color: Mapped[str] = mapped_column(String(20), default="#4F46E5")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)