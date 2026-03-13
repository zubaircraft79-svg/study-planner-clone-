from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.models import StudyBlock, StudySession, Subject
from app.schemas.block import StudyBlockOut, StudyBlockUpdate

router = APIRouter(prefix="/blocks", tags=["blocks"])


def build_block_out(row: StudyBlock, subject: Subject | None) -> StudyBlockOut:
    return StudyBlockOut(
        id=row.id,
        subject_id=row.subject_id,
        subject_name=subject.name if subject else "Unknown",
        subject_color=subject.color if subject else "#6B7280",
        block_date=row.block_date,
        starts_at=row.starts_at,
        ends_at=row.ends_at,
        minutes=row.minutes,
        block_type=row.block_type,
        status=row.status,
        locked=row.locked,
        order_index=row.order_index,
        reason=row.reason,
    )


@router.get("", response_model=list[StudyBlockOut])
def list_blocks(start: date, end: date, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    rows = (
        db.query(StudyBlock, Subject)
        .join(Subject, Subject.id == StudyBlock.subject_id)
        .filter(
            StudyBlock.user_id == user_id,
            Subject.user_id == user_id,
            StudyBlock.created_at >= Subject.created_at,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
        )
        .order_by(StudyBlock.block_date.asc(), StudyBlock.starts_at.asc(), StudyBlock.id.asc())
        .all()
    )

    return [build_block_out(block, subject) for block, subject in rows]


@router.patch("/{block_id}", response_model=StudyBlockOut)
def update_block(
    block_id: int,
    payload: StudyBlockUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    row = db.query(StudyBlock).filter(StudyBlock.user_id == user_id, StudyBlock.id == block_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    if payload.status is not None:
        row.status = payload.status
    if payload.locked is not None:
        row.locked = payload.locked

    db.commit()
    subject = db.query(Subject).filter(Subject.id == row.subject_id, Subject.user_id == user_id).first()
    return build_block_out(row, subject)


@router.post("/{block_id}/complete", response_model=StudyBlockOut)
def complete_block(block_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = db.query(StudyBlock).filter(StudyBlock.user_id == user_id, StudyBlock.id == block_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    subject = db.query(Subject).filter(Subject.id == row.subject_id, Subject.user_id == user_id).first()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    existing_session = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.source_block_id == row.id,
        )
        .first()
    )

    if row.status != "completed":
        row.status = "completed"

    if existing_session is None:
        db.add(
            StudySession(
                user_id=user_id,
                subject_id=row.subject_id,
                source_block_id=row.id,
                actual_minutes=row.minutes,
                started_at=row.starts_at,
                completed_at=row.ends_at,
                notes="Completed from planned block",
            )
        )

    db.commit()
    db.refresh(row)
    return build_block_out(row, subject)


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(block_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = db.query(StudyBlock).filter(StudyBlock.user_id == user_id, StudyBlock.id == block_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    linked_session = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == user_id,
            StudySession.source_block_id == row.id,
        )
        .first()
    )
    if linked_session is not None:
        db.delete(linked_session)

    db.delete(row)
    db.commit()