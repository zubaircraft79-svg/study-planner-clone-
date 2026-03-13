from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from math import ceil

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
    fixed_start: datetime | None = None
    fixed_end: datetime | None = None


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
        .join(Subject, and_(Subject.id == StudySession.subject_id, Subject.user_id == user_id))
        .filter(
            StudySession.user_id == user_id,
            StudySession.created_at >= Subject.created_at,
        )
        .group_by(StudySession.subject_id)
        .all()
    )
    return {subject_id: int(total or 0) for subject_id, total in rows}


def recent_sessions_map(db: Session, user_id: str, start: date, end: date) -> dict[int, list[tuple[date, int]]]:
    lower_bound = start - timedelta(days=max(REVIEW_INTERVALS))
    rows = (
        db.query(StudySession.subject_id, StudySession.started_at, StudySession.actual_minutes)
        .join(Subject, and_(Subject.id == StudySession.subject_id, Subject.user_id == user_id))
        .filter(
            StudySession.user_id == user_id,
            StudySession.created_at >= Subject.created_at,
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


def subject_score(
    subject: Subject,
    remaining_minutes: int,
    day: date,
    capacities: dict[date, int],
    last_scheduled_subject_id: int | None,
) -> float:
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


def minutes_allowed_today(
    subject: Subject,
    day: date,
    remaining_minutes: int,
    capacities: dict[date, int],
    prefs: UserPreferences,
    already_scheduled_today: int,
) -> int:
    if remaining_minutes <= 0:
        return 0

    deadline = subject.exam_date or max(capacities)
    future_days = max(count_future_capacity_days(capacities, day, deadline), 1)
    days_left = max((deadline - day).days, 0)
    preferred = max(int(prefs.session_minutes), MIN_SESSION_MINUTES)
    blocks_needed = ceil(remaining_minutes / preferred)

    urgent = days_left <= 3
    heavy_backlog = blocks_needed > future_days

    if urgent or heavy_backlog:
        return max(remaining_minutes - already_scheduled_today, 0)

    daily_cap = min(preferred, remaining_minutes)
    return max(daily_cap - already_scheduled_today, 0)


def next_break_minutes(prefs: UserPreferences, streak: int) -> int:
    if streak > 0 and streak % prefs.long_break_every == 0:
        return prefs.long_break_minutes
    return prefs.short_break_minutes


def materialize_preview_blocks(subject_map: dict[int, Subject], prefs: UserPreferences, blocks: list[PlannedBlock]) -> list[StudyBlockOut]:
    grouped: dict[date, list[PlannedBlock]] = defaultdict(list)
    for block in blocks:
        grouped[block.block_date].append(block)

    results: list[StudyBlockOut] = []
    synthetic_id = -1

    for day in sorted(grouped):
        day_blocks = grouped[day]
        fixed_blocks = sorted(
            [block for block in day_blocks if block.fixed_start is not None and block.fixed_end is not None],
            key=lambda item: item.fixed_start,
        )
        flexible_blocks = sorted(
            [block for block in day_blocks if block.fixed_start is None or block.fixed_end is None],
            key=lambda item: item.order_index,
        )

        current_time = datetime.combine(day, time(hour=prefs.day_start_hour, minute=0))
        flexible_index = 0
        flexible_streak = 0
        day_results: list[tuple[datetime, StudyBlockOut]] = []

        def push_block(block: PlannedBlock, start_at: datetime, end_at: datetime):
            nonlocal synthetic_id
            subject = subject_map[block.subject_id]
            day_results.append(
                (
                    start_at,
                    StudyBlockOut(
                        id=synthetic_id,
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
                    ),
                )
            )
            synthetic_id -= 1

        for fixed in fixed_blocks:
            fixed_start = fixed.fixed_start
            fixed_end = fixed.fixed_end

            while flexible_index < len(flexible_blocks):
                candidate = flexible_blocks[flexible_index]
                candidate_start = current_time
                candidate_end = candidate_start + timedelta(minutes=candidate.minutes)

                if candidate_end <= fixed_start:
                    push_block(candidate, candidate_start, candidate_end)
                    flexible_index += 1
                    flexible_streak += 1
                    current_time = candidate_end + timedelta(minutes=next_break_minutes(prefs, flexible_streak))
                else:
                    break

            push_block(fixed, fixed_start, fixed_end)
            current_time = max(current_time, fixed_end)

        while flexible_index < len(flexible_blocks):
            candidate = flexible_blocks[flexible_index]
            candidate_start = current_time
            candidate_end = candidate_start + timedelta(minutes=candidate.minutes)
            push_block(candidate, candidate_start, candidate_end)
            flexible_index += 1
            flexible_streak += 1
            current_time = candidate_end + timedelta(minutes=next_break_minutes(prefs, flexible_streak))

        results.extend([item for _, item in sorted(day_results, key=lambda pair: pair[0])])

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
        .join(Subject, and_(Subject.id == StudyBlock.subject_id, Subject.user_id == user_id))
        .filter(
            StudyBlock.user_id == user_id,
            StudyBlock.created_at >= Subject.created_at,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
            StudyBlock.locked.is_(True),
        )
        .order_by(StudyBlock.block_date.asc(), StudyBlock.starts_at.asc(), StudyBlock.id.asc())
        .all()
    )

    locked_minutes_by_day: dict[date, int] = defaultdict(int)
    locked_minutes_by_subject: dict[int, int] = defaultdict(int)
    planned_blocks: list[PlannedBlock] = []
    order_counter_by_day: dict[date, int] = defaultdict(int)
    seen_locked_signatures: set[tuple] = set()

    for block in locked_blocks:
        signature = (
            block.subject_id,
            block.block_date,
            block.starts_at,
            block.ends_at,
            block.minutes,
            block.block_type,
            block.reason,
        )
        if signature in seen_locked_signatures:
            continue
        seen_locked_signatures.add(signature)

        locked_minutes_by_day[block.block_date] += int(block.minutes)
        locked_minutes_by_subject[block.subject_id] += int(block.minutes)

        planned_blocks.append(
            PlannedBlock(
                subject_id=block.subject_id,
                block_date=block.block_date,
                minutes=int(block.minutes),
                block_type=block.block_type,
                reason=block.reason,
                order_index=block.order_index,
                locked=True,
                fixed_start=block.starts_at,
                fixed_end=block.ends_at,
            )
        )
        order_counter_by_day[block.block_date] = max(order_counter_by_day[block.block_date], block.order_index)

    for block_day, locked_minutes in locked_minutes_by_day.items():
        capacities[block_day] = max(capacities.get(block_day, 0) - locked_minutes, 0)

    completed_minutes = current_completed_minutes(db, user_id)
    remaining_budget = {
        subject.id: max(
            subject.required_minutes
            - completed_minutes.get(subject.id, 0)
            - locked_minutes_by_subject.get(subject.id, 0),
            0,
        )
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
        scheduled_total_today: dict[int, int] = defaultdict(int)

        for subject_id, minutes_due in sorted(review_due.get(day, {}).items(), key=lambda item: item[1], reverse=True):
            if capacity <= 0:
                break

            subject = subject_map.get(subject_id)
            if subject is None:
                continue

            subject_budget = remaining_budget.get(subject_id, 0)
            if subject_budget <= 0:
                continue

            allowed_today = minutes_allowed_today(
                subject=subject,
                day=day,
                remaining_minutes=subject_budget,
                capacities=capacities,
                prefs=prefs,
                already_scheduled_today=scheduled_total_today[subject_id],
            )
            if allowed_today <= 0:
                continue

            minutes = choose_block_minutes(
                min(prefs.session_minutes, allowed_today),
                min(minutes_due, subject_budget, allowed_today),
                capacity,
            )
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
            remaining_budget[subject_id] -= minutes
            scheduled_total_today[subject_id] += minutes
            review_due[day][subject_id] = max(review_due[day][subject_id] - minutes, 0)
            last_subject_id = subject_id
            scheduled_history[subject_id].append(day)

        for subject_id, minutes_due in sorted(revision_due.get(day, {}).items(), key=lambda item: item[1], reverse=True):
            if capacity <= 0:
                break

            subject = subject_map.get(subject_id)
            if subject is None:
                continue

            subject_budget = remaining_budget.get(subject_id, 0)
            if subject_budget <= 0:
                continue

            allowed_today = minutes_allowed_today(
                subject=subject,
                day=day,
                remaining_minutes=subject_budget,
                capacities=capacities,
                prefs=prefs,
                already_scheduled_today=scheduled_total_today[subject_id],
            )
            if allowed_today <= 0:
                continue

            minutes = choose_block_minutes(
                min(prefs.session_minutes, allowed_today),
                min(minutes_due, subject_budget, allowed_today),
                capacity,
            )
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
            remaining_budget[subject_id] -= minutes
            scheduled_total_today[subject_id] += minutes
            revision_due[day][subject_id] = max(revision_due[day][subject_id] - minutes, 0)
            last_subject_id = subject_id
            scheduled_history[subject_id].append(day)

        while capacity >= MIN_SESSION_MINUTES:
            scored_subjects: list[tuple[float, Subject]] = []
            for subject in subjects:
                remaining = remaining_budget.get(subject.id, 0)
                if remaining <= 0:
                    continue

                allowed_today = minutes_allowed_today(
                    subject=subject,
                    day=day,
                    remaining_minutes=remaining,
                    capacities=capacities,
                    prefs=prefs,
                    already_scheduled_today=scheduled_total_today[subject.id],
                )
                if allowed_today <= 0:
                    continue

                score = subject_score(subject, remaining, day, capacities, last_scheduled_subject_id=last_subject_id)

                recent_hits = sum(1 for entry_day in scheduled_history[subject.id] if 0 <= (day - entry_day).days <= 2)
                same_day_penalty = 0.45 if scheduled_total_today[subject.id] > 0 else 0.0
                score -= recent_hits * 0.22
                score -= same_day_penalty

                scored_subjects.append((score, subject))

            if not scored_subjects:
                break

            scored_subjects.sort(key=lambda item: item[0], reverse=True)
            top_score, selected = scored_subjects[0]
            if top_score <= 0:
                break

            allowed_today = minutes_allowed_today(
                subject=selected,
                day=day,
                remaining_minutes=remaining_budget[selected.id],
                capacities=capacities,
                prefs=prefs,
                already_scheduled_today=scheduled_total_today[selected.id],
            )
            if allowed_today <= 0:
                break

            minutes = choose_block_minutes(
                min(prefs.session_minutes, allowed_today),
                min(remaining_budget[selected.id], allowed_today),
                capacity,
            )
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

            remaining_budget[selected.id] -= minutes
            scheduled_total_today[selected.id] += minutes
            capacity -= minutes
            last_subject_id = selected.id
            scheduled_history[selected.id].append(day)

            for gap, fraction in zip(REVIEW_INTERVALS, REVIEW_FRACTIONS, strict=True):
                due_day = day + timedelta(days=gap)
                if due_day <= end:
                    review_due[due_day][selected.id] += max(MIN_SESSION_MINUTES, int(round(minutes * fraction)))

        next_day = day + timedelta(days=1)
        if next_day <= end:
            for subject_id, minutes_due in list(review_due.get(day, {}).items()):
                if minutes_due > 0:
                    review_due[next_day][subject_id] += minutes_due
            for subject_id, minutes_due in list(revision_due.get(day, {}).items()):
                if minutes_due > 0:
                    revision_due[next_day][subject_id] += minutes_due

        review_due[day].clear()
        revision_due[day].clear()

    for subject in subjects:
        unmet = max(remaining_budget.get(subject.id, 0), 0)
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

    existing_locked_rows = (
        db.query(StudyBlock)
        .filter(
            StudyBlock.user_id == user_id,
            StudyBlock.block_date >= start,
            StudyBlock.block_date <= end,
            StudyBlock.locked.is_(True),
        )
        .order_by(StudyBlock.id.asc())
        .all()
    )

    seen_locked_signatures: set[tuple] = set()
    for row in existing_locked_rows:
        signature = (
            row.subject_id,
            row.block_date,
            row.starts_at,
            row.ends_at,
            row.minutes,
            row.block_type,
            row.reason,
        )
        if signature in seen_locked_signatures:
            db.delete(row)
        else:
            seen_locked_signatures.add(signature)

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
        if block.locked:
            continue

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