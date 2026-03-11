from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.schemas.progress import SubjectProgressOut
from app.services.metrics import build_subject_progress

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/subjects", response_model=list[SubjectProgressOut])
def subject_progress(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    return build_subject_progress(db=db, user_id=user_id)