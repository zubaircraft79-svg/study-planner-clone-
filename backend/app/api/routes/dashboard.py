from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.schemas.dashboard import DashboardSummary
from app.services.metrics import build_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    today = date.today()
    start = start or today
    end = end or (today + timedelta(days=14))
    return build_dashboard_summary(db=db, user_id=user_id, start=start, end=end)