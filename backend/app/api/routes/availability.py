from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.models import AvailabilityOverride, AvailabilityTemplate
from app.schemas.availability import (
    AvailabilityOverrideCreate,
    AvailabilityOverrideOut,
    AvailabilityTemplateOut,
    AvailabilityTemplateUpdate,
)
from app.services.planner import ensure_default_templates

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("/templates", response_model=list[AvailabilityTemplateOut])
def list_templates(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    ensure_default_templates(db, user_id)
    rows = db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user_id).order_by(AvailabilityTemplate.weekday.asc()).all()
    return rows


@router.put("/templates", response_model=list[AvailabilityTemplateOut])
def update_templates(
    payload: list[AvailabilityTemplateUpdate],
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    ensure_default_templates(db, user_id)
    existing = {
        row.weekday: row
        for row in db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user_id).all()
    }
    for item in payload:
        row = existing.get(item.weekday)
        if row is None:
            row = AvailabilityTemplate(user_id=user_id, weekday=item.weekday)
            db.add(row)
        row.minutes_available = item.minutes_available
        row.is_rest_day = item.is_rest_day
    db.commit()
    return db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user_id).order_by(AvailabilityTemplate.weekday.asc()).all()


@router.get("/overrides", response_model=list[AvailabilityOverrideOut])
def list_overrides(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return (
        db.query(AvailabilityOverride)
        .filter(
            AvailabilityOverride.user_id == user_id,
            AvailabilityOverride.override_date >= start,
            AvailabilityOverride.override_date <= end,
        )
        .order_by(AvailabilityOverride.override_date.asc())
        .all()
    )


@router.post("/overrides", response_model=AvailabilityOverrideOut, status_code=status.HTTP_201_CREATED)
def create_or_replace_override(
    payload: AvailabilityOverrideCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    row = (
        db.query(AvailabilityOverride)
        .filter(
            AvailabilityOverride.user_id == user_id,
            AvailabilityOverride.override_date == payload.override_date,
        )
        .first()
    )
    if row is None:
        row = AvailabilityOverride(user_id=user_id, override_date=payload.override_date)
        db.add(row)
    row.minutes_available = payload.minutes_available
    row.is_rest_day = payload.is_rest_day
    db.commit()
    db.refresh(row)
    return row


@router.delete("/overrides/{override_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_override(override_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = db.query(AvailabilityOverride).filter(AvailabilityOverride.user_id == user_id, AvailabilityOverride.id == override_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Override not found")
    db.delete(row)
    db.commit()