from collections.abc import Generator

from fastapi import Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal

settings = get_settings()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_id(x_user_id: str | None = Header(default=None)) -> str:
    user_id = x_user_id or settings.default_user_id
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user identifier")
    return user_id