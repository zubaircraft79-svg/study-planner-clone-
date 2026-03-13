from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.models import StudyBlock, StudySession, Subject
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    return (
        db.query(Subject)
        .filter(Subject.user_id == user_id)
        .order_by(Subject.exam_date.asc().nullslast(), Subject.name.asc())
        .all()
    )


@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = Subject(user_id=user_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    row = db.query(Subject).filter(Subject.user_id == user_id, Subject.id == subject_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)

    db.commit()
    db.refresh(row)
    return row


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = db.query(Subject).filter(Subject.user_id == user_id, Subject.id == subject_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    db.query(StudySession).filter(
        StudySession.user_id == user_id,
        StudySession.subject_id == subject_id,
    ).delete(synchronize_session=False)

    db.query(StudyBlock).filter(
        StudyBlock.user_id == user_id,
        StudyBlock.subject_id == subject_id,
    ).delete(synchronize_session=False)

    db.delete(row)
    db.commit()