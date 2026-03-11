from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.models import StudySession, Subject
from app.schemas.session import StudySessionCreate, StudySessionOut

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[StudySessionOut])
def list_sessions(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    return db.query(StudySession).filter(StudySession.user_id == user_id).order_by(StudySession.started_at.desc()).all()


@router.post("", response_model=StudySessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: StudySessionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    subject = db.query(Subject).filter(Subject.user_id == user_id, Subject.id == payload.subject_id).first()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    row = StudySession(user_id=user_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row