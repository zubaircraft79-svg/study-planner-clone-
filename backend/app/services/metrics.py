from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import StudyBlock, StudySession, Subject
from app.schemas.dashboard import DashboardSummary
from app.schemas.progress import SubjectProgressOut


def build_subject_progress(db: Session, user_id: str) -> list[SubjectProgressOut]:
    subjects = db.query(Subject).filter(Subject.user_id == user_id).order_by(Subject.exam_date.asc().nullslast(), Subject.name.asc()).all()
    completed_rows = (
        db.query(StudySession.subject_id, func.sum(StudySession.actual_minutes))
        .filter(StudySession.user_id == user_id)
        .group_by(StudySession.subject_id)
        .all()
    )
    completed_map = {subject_id: int(total or 0) for subject_id, total in completed_rows}

    results: list[SubjectProgressOut] = []
    for subject in subjects:
        completed = completed_map.get(subject.id, 0)
        remaining = max(subject.required_minutes - completed, 0)
        progress = 0.0 if subject.required_minutes <= 0 else round((completed / subject.required_minutes) * 100, 1)
        results.append(
            SubjectProgressOut(
                subject_id=subject.id,
                subject_name=subject.name,
                color=subject.color,
                required_minutes=subject.required_minutes,
                completed_minutes=completed,
                remaining_minutes=remaining,
                progress_percent=min(progress, 100.0),
                exam_date=subject.exam_date,
            )
        )
    return results


def build_dashboard_summary(db: Session, user_id: str, start: date, end: date) -> DashboardSummary:
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    blocks = (
        db.query(StudyBlock)
        .filter(StudyBlock.user_id == user_id, StudyBlock.block_date >= start, StudyBlock.block_date <= end)
        .all()
    )
    sessions = db.query(StudySession).filter(StudySession.user_id == user_id).all()

    total_planned = sum(int(block.minutes) for block in blocks)
    total_completed = sum(int(session.actual_minutes) for session in sessions)
    upcoming_subjects = [subject for subject in subjects if subject.exam_date and subject.exam_date >= start]
    next_exam = min(upcoming_subjects, key=lambda item: item.exam_date, default=None)
    total_required = sum(max(int(subject.required_minutes), 0) for subject in subjects)
    completion_rate = round((total_completed / total_required) * 100, 1) if total_required else 0.0

    return DashboardSummary(
        total_subjects=len(subjects),
        total_planned_minutes=total_planned,
        total_completed_minutes=total_completed,
        upcoming_exams=len(upcoming_subjects),
        completion_rate=min(completion_rate, 100.0),
        next_exam_subject=next_exam.name if next_exam else None,
        next_exam_date=next_exam.exam_date.isoformat() if next_exam and next_exam.exam_date else None,
    )