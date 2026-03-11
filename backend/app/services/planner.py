from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from math import ceil
from uuid import uuid4

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models import AvailabilityOverride, AvailabilityTemplate, StudyBlock, StudySession, Subject, UserPreferences
from app.schemas.block import StudyBlockOut
from app.schemas.planner import PlannerPreview, PlannerWarning

MIN_SESSION_MINUTES = 20
REVIEW_INTERVALS = (1, 3, 7)
REVIEW_FRACTIONS = (0.35, 0.25, 0.15)
REVISION_OFFSETS = (7, 3, 1)


@dataclass
class PlannedBlock:
    subject_id: int
    block_date: date
    minutes: int
    block_type: str
    reason: str
    order_index: int
    locked: bool = False


DEFAULT_TEMPLATE = {
    0: (120, False),
    1: (120, False),
    2: (120, False),
    3: (120, False),
    4: (120, False),
    5: (90, False),
    6: (0, True),
}


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def get_or_create_preferences(db: Session, user_id: str) -> UserPreferences:
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    if prefs:
        return prefs
    prefs = UserPreferences(user_id=user_id)
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


def ensure_default_templates(db: Session, user_id: str) -> None:
    existing = db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user_id).count()
    if existing:
        return
    for weekday, (minutes_available, is_rest_day) in DEFAULT_TEMPLATE.items():
        db.add(
            AvailabilityTemplate(
                user_id=user_id,
                weekday=weekday,
                minutes_available=minutes_available,
                is_rest_day=is_rest_day,
            )
        )
    db.commit()


def build_capacity_map(db: Session, user_id: str, start: date, end: date) -> dict[date, int]:
    ensure_default_templates(db, user_id)
    templates = db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user_id).all()
    overrides = (
        db.query(AvailabilityOverride)
        .filter(
            AvailabilityOverride.user_id == user_id,
            AvailabilityOverride.override_date >= start,
            AvailabilityOverride.override_date <= end,
        )
        .all()
    )
    template_map = {row.weekday: row for row in templates}
    override_map = {row.override_date: row for row in overrides}
    capacities: dict[date, int] = {}
    for day in daterange(start, end):
        if day in override_map:
            override = override_map[day]
            capacities[day] = 0 if override.is_rest_day else int(override.minutes_available)
            continue
        template = template_map.get(day.weekday())
        if template is None:
            minutes_available, is_rest_day = DEFAULT_TEMPLATE[day.weekday()]
            capacities[day] = 0 if is_rest_day else minutes_available
        else:
            capacities[day] = 0 if template.is_rest_day else int(template.minutes_available)
    return capacities


def current_completed_minutes(db: Session, user_id: str) -> dict[int, int]:
    rows = (
        db.query(StudySession.subject_id, func.sum(StudySession.actual_minutes))
        .filter(StudySession.user_id == user_id)
        .group_by(StudySession.subject_id)
        .all()
    )
    return {subject_id: int(total or 0) for subject_id, total in rows}


def recent_sessions_map(db: Session, user_id: str, start: date, end: date) -> dict[int, list[tuple[date, int]]]:
    lower_bound = start - timedelta(days=max(REVIEW_INTERVALS))
    rows = (
        db.query(StudySession.subject_id, StudySession.started_at, StudySession.actual_minutes)
        .filter(
            StudySession.user_id == user_id,
            StudySession.started_at >= datetime.combine(lower_bound, time.min),
            StudySession.started_at <= datetime.combine(end, time.max),
        )
        .all()
    )
    grouped: dict[int, list[tuple[date, int]]] = defaultdict(list)
    for subject_id, started_at, minutes in rows:
        grouped[int(subject_id)].append((started_at.date(), int(minutes)))
    return grouped


def seed_review_demands(subject_sessions: dict[int, list[tuple[date, int]]], start: date, end: date) -> dict[date, dict[int, int]]:
    review_due: dict[date, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for subject_id, sessions in subject_sessions.items():
        for session_day, minutes in sessions:
            for gap, fraction in zip(REVIEW_INTERVALS, REVIEW_FRACTIONS, strict=True):
                due_day = session_day + timedelta(days=gap)
                if start <= due_day <= end:
                    review_due[due_day][subject_id] += max(MIN_SESSION_MINUTES, int(round(minutes * fraction)))
    return review_due


def seed_revision_demands(subjects: list[Subject], prefs: UserPreferences, start: date, end: date) -> dict[date, dict[int, int]]:
    revision_due: dict[date, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for subject in subjects:
        if not subject.exam_date:
            continue
        for offset in REVISION_OFFSETS:
            due_day = subject.exam_date - timedelta(days=offset)
            if not (start <= due_day <= end):
                continue
            base_minutes = int(min(90, max(prefs.session_minutes, round(subject.required_minutes * 0.12))))
            scaled = min(120, int(base_minutes * (0.85 + subject.difficulty * 0.07 + subject.priority * 0.05)))
            revision_due[due_day][subject.id] += scaled
    return revision_due


def count_future_capacity_days(capacities: dict[date, int], day: date, deadline: date) -> int:
    return sum(1 for key, value in capacities.items() if day <= key <= deadline and value > 0)


def subject_score(subject: Subject, remaining_minutes: int, day: date, capacities: dict[date, int], last_scheduled_subject_id: int | None) -> float:
    deadline = subject.exam_date or max(capacities)
    if deadline < day:
        return -1.0
    days_left = max((deadline - day).days, 0)
    future_capacity_days = max(count_future_capacity_days(capacities, day, deadline), 1)
    load_pressure = remaining_minutes / max(future_capacity_days * 60, 1)
    urgency = 1 / (days_left + 1)
    difficulty = subject.difficulty / 5
    priority = subject.priority / 5
    repeat_penalty = 0.35 if last_scheduled_subject_id == subject.id else 0.0
    near_exam_boost = 0.5 if days_left <= 2 else 0.0
    return 3.8 * load_pressure + 3.2 * urgency + 1.4 * difficulty + 1.6 * priority + near_exam_boost - repeat_penalty


def choose_block_minutes(preferred: int, remaining: int, capacity: int) -> int:
    alloc = min(preferred, remaining, capacity)
    if alloc >= MIN_SESSION_MINUTES:
        return alloc
    if remaining >= MIN_SESSION_MINUTES and capacity >= MIN_SESSION_MINUTES:
        return min(remaining, capacity)
    if remaining < MIN_SESSION_MINUTES and capacity >= remaining:
        return remaining
    return 0


def materialize_preview_blocks(subject_map: dict[int, Subject], prefs: UserPreferences, blocks: list[PlannedBlock]) -> list[StudyBlockOut]:
    grouped: dict[date, list[PlannedBlock]] = defaultdict(list)
    for block in blocks:
        grouped[block.block_date].append(block)

    results: list[StudyBlockOut] = []
    for day in sorted(grouped):
        current_time = datetime.combine(day, time(hour=prefs.day_start_hour, minute=0))
        streak = 0
        for index, block in enumerate(sorted(grouped[day], key=lambda item: item.order_index), start=1):
            subject = subject_map[block.subject_id]
            start_at = current_time
            end_at = start_at + timedelta(minutes=block.minutes)
            results.append(
                StudyBlockOut(
                    id=-index,
                    subject_id=block.subject_id,
                    subject_name=subject.name,
                    subject_color=subject.color,
                    block_date=block.block_date,
                    starts_at=start_at,
                    ends_at=end_at,
                    minutes=block.minutes,
                    block_type=block.block_type,
                    status="planned",
                    locked=block.locked,
                    order_index=block.order_index,
                    reason=block.reason,
                )
            )
            streak += 1
            break_minutes = prefs.long_break_minutes if streak % prefs.long_break_every == 0 else prefs.short_break_minutes
            current_time = end_at + timedelta(minutes=break_minutes)
    return results


def preview_plan(db: Session, user_id: str, start: date, end: date) -> PlannerPreview:
    if end < start:
        raise ValueError("end_date must be greater than or equal to start_date")

    prefs = get_or_create_preferences(db, user_id)
    subjects = (
        db.query(Subject)
        .filter(Subject.user_id == user_id)
        .order_by(Subject.exam_date.asc().nullslast(), Subject.name.asc())
        .all()
    )
    subject_map = {subject.id: subject for subject in subjects}
    if not subjects:
        return PlannerPreview(blocks=[], total_minutes=0, warnings=[])

    capacities = build_capacity_map(db, user_id, start, end)

    locked_blocks = (
        db.query(StudyBlock)
        .filter(
            StudyBlock.user_id == user_id,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
            StudyBlock.locked.is_(True),
        )
        .all()
    )
    locked_minutes_by_day: dict[date, int] = defaultdict(int)
    planned_blocks: list[PlannedBlock] = []
    order_counter_by_day: dict[date, int] = defaultdict(int)
    for block in locked_blocks:
        locked_minutes_by_day[block.block_date] += int(block.minutes)
        planned_blocks.append(
            PlannedBlock(
                subject_id=block.subject_id,
                block_date=block.block_date,
                minutes=int(block.minutes),
                block_type=block.block_type,
                reason=block.reason,
                order_index=block.order_index,
                locked=True,
            )
        )
        order_counter_by_day[block.block_date] = max(order_counter_by_day[block.block_date], block.order_index)

    for block_day, locked_minutes in locked_minutes_by_day.items():
        capacities[block_day] = max(capacities.get(block_day, 0) - locked_minutes, 0)

    completed_minutes = current_completed_minutes(db, user_id)
    base_remaining = {
        subject.id: max(subject.required_minutes - completed_minutes.get(subject.id, 0), 0)
        for subject in subjects
    }

    recent_session_history = recent_sessions_map(db, user_id, start, end)
    review_due = seed_review_demands(recent_session_history, start, end)
    revision_due = seed_revision_demands(subjects, prefs, start, end)

    warning_messages: list[PlannerWarning] = []
    scheduled_history: dict[int, list[date]] = defaultdict(list)

    for day in daterange(start, end):
        capacity = capacities.get(day, 0)
        if capacity <= 0:
            continue

        day_order = order_counter_by_day[day]
        last_subject_id: int | None = None

        for subject_id, minutes_due in sorted(review_due.get(day, {}).items(), key=lambda item: item[1], reverse=True):
            if capacity <= 0:
                break
            minutes = choose_block_minutes(prefs.session_minutes, minutes_due, capacity)
            if minutes <= 0:
                continue
            day_order += 1
            planned_blocks.append(
                PlannedBlock(
                    subject_id=subject_id,
                    block_date=day,
                    minutes=minutes,
                    block_type="review",
                    reason="Spaced repetition review",
                    order_index=day_order,
                )
            )
            capacity -= minutes
            review_due[day][subject_id] = max(review_due[day][subject_id] - minutes, 0)
            last_subject_id = subject_id
            scheduled_history[subject_id].append(day)

        for subject_id, minutes_due in sorted(revision_due.get(day, {}).items(), key=lambda item: item[1], reverse=True):
            if capacity <= 0:
                break
            minutes = choose_block_minutes(prefs.session_minutes, minutes_due, capacity)
            if minutes <= 0:
                continue
            day_order += 1
            planned_blocks.append(
                PlannedBlock(
                    subject_id=subject_id,
                    block_date=day,
                    minutes=minutes,
                    block_type="revision",
                    reason="Pre-exam revision session",
                    order_index=day_order,
                )
            )
            capacity -= minutes
            revision_due[day][subject_id] = max(revision_due[day][subject_id] - minutes, 0)
            last_subject_id = subject_id
            scheduled_history[subject_id].append(day)

        while capacity >= MIN_SESSION_MINUTES:
            scored_subjects: list[tuple[float, Subject]] = []
            for subject in subjects:
                remaining = base_remaining.get(subject.id, 0)
                if remaining <= 0:
                    continue
                score = subject_score(subject, remaining, day, capacities, last_subject_id)
                recent_hits = sum(1 for entry_day in scheduled_history[subject.id] if 0 <= (day - entry_day).days <= 2)
                score -= recent_hits * 0.18
                scored_subjects.append((score, subject))

            if not scored_subjects:
                break

            scored_subjects.sort(key=lambda item: item[0], reverse=True)
            top_score, selected = scored_subjects[0]
            if top_score <= 0:
                break

            minutes = choose_block_minutes(prefs.session_minutes, base_remaining[selected.id], capacity)
            if minutes <= 0:
                break

            day_order += 1
            planned_blocks.append(
                PlannedBlock(
                    subject_id=selected.id,
                    block_date=day,
                    minutes=minutes,
                    block_type="study",
                    reason="Core study workload",
                    order_index=day_order,
                )
            )
            base_remaining[selected.id] -= minutes
            capacity -= minutes
            last_subject_id = selected.id
            scheduled_history[selected.id].append(day)

            for gap, fraction in zip(REVIEW_INTERVALS, REVIEW_FRACTIONS, strict=True):
                due_day = day + timedelta(days=gap)
                if due_day <= end:
                    review_due[due_day][selected.id] += max(MIN_SESSION_MINUTES, int(round(minutes * fraction)))

    for subject in subjects:
        remaining = base_remaining.get(subject.id, 0)
        due_reviews = sum(review_due[day].get(subject.id, 0) for day in review_due)
        due_revisions = sum(revision_due[day].get(subject.id, 0) for day in revision_due)
        unmet = remaining + due_reviews + due_revisions
        if unmet > 0:
            warning_messages.append(
                PlannerWarning(
                    code="INSUFFICIENT_CAPACITY",
                    message=f"Not enough available time to fully schedule {subject.name}. {unmet} minutes remain unscheduled.",
                )
            )

    preview_blocks = materialize_preview_blocks(subject_map=subject_map, prefs=prefs, blocks=planned_blocks)
    total_minutes = sum(block.minutes for block in preview_blocks)
    return PlannerPreview(blocks=preview_blocks, total_minutes=total_minutes, warnings=warning_messages)


def save_preview_as_blocks(db: Session, user_id: str, preview: PlannerPreview) -> None:
    if not preview.blocks:
        return
    start = min(block.block_date for block in preview.blocks)
    end = max(block.block_date for block in preview.blocks)

    rows = (
        db.query(StudyBlock)
        .filter(
            StudyBlock.user_id == user_id,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
            StudyBlock.locked.is_(False),
        )
        .all()
    )
    for row in rows:
        db.delete(row)
    db.flush()

    for block in preview.blocks:
        db.add(
            StudyBlock(
                user_id=user_id,
                subject_id=block.subject_id,
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
        )
    db.commit()