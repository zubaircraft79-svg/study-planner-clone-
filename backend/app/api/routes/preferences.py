from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.schemas.preferences import PreferencesOut, PreferencesUpdate
from app.services.planner import get_or_create_preferences

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("", response_model=PreferencesOut)
def get_preferences(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    return get_or_create_preferences(db, user_id)


@router.put("", response_model=PreferencesOut)
def update_preferences(
    payload: PreferencesUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    prefs = get_or_create_preferences(db, user_id)
    for key, value in payload.model_dump().items():
        setattr(prefs, key, value)
    db.commit()
    db.refresh(prefs)
    return prefs