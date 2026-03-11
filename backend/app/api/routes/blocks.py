from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.models import StudyBlock, Subject
from app.schemas.block import StudyBlockOut, StudyBlockUpdate

router = APIRouter(prefix="/blocks", tags=["blocks"])


@router.get("", response_model=list[StudyBlockOut])
def list_blocks(start: date, end: date, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    rows = (
        db.query(StudyBlock, Subject)
        .join(Subject, Subject.id == StudyBlock.subject_id)
        .filter(
            StudyBlock.user_id == user_id,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
        )
        .order_by(StudyBlock.block_date.asc(), StudyBlock.starts_at.asc())
        .all()
    )
    return [
        StudyBlockOut(
            id=block.id,
            subject_id=block.subject_id,
            subject_name=subject.name,
            subject_color=subject.color,
            block_date=block.block_date,
            starts_at=block.starts_at,
            ends_at=block.ends_at,
            minutes=block.minutes,
            block_type=block.block_type,
            status=block.status,
            locked=block.locked,
            order_index=block.order_index,
            reason=block.reason,
        )
        for block, subject in rows
    ]


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
    subject = db.query(Subject).filter(Subject.id == row.subject_id).first()
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


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(block_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    row = db.query(StudyBlock).filter(StudyBlock.user_id == user_id, StudyBlock.id == block_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    db.delete(row)
    db.commit()