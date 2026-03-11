from datetime import datetime


def seed_subject(client, name: str, exam_date: str, difficulty: int, priority: int, required_minutes: int):
    response = client.post(
        "/subjects",
        json={
            "name": name,
            "exam_date": exam_date,
            "difficulty": difficulty,
            "priority": priority,
            "required_minutes": required_minutes,
            "color": "#4F46E5",
        },
        headers={"X-User-Id": "demo-user"},
    )
    assert response.status_code == 201
    return response.json()


def test_preview_plan_creates_realistic_blocks(client):
    seed_subject(client, "Math", "2026-03-18", 5, 5, 720)
    seed_subject(client, "History", "2026-03-28", 2, 2, 300)

    response = client.post(
        "/planner/preview",
        json={"start_date": "2026-03-12", "end_date": "2026-03-20"},
        headers={"X-User-Id": "demo-user"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_minutes"] > 0
    assert len(data["blocks"]) > 0
    assert any(block["block_type"] in {"study", "revision", "review"} for block in data["blocks"])


def test_generate_and_save_then_list_blocks(client):
    algebra = seed_subject(client, "Algebra", "2026-03-19", 4, 5, 500)
    client.post(
        "/planner/generate-and-save",
        json={"start_date": "2026-03-12", "end_date": "2026-03-20"},
        headers={"X-User-Id": "demo-user"},
    )

    blocks = client.get("/blocks?start=2026-03-12&end=2026-03-20", headers={"X-User-Id": "demo-user"})
    assert blocks.status_code == 200
    rows = blocks.json()
    assert rows
    assert any(row["subject_id"] == algebra["id"] for row in rows)


def test_sessions_affect_progress(client):
    subject = seed_subject(client, "Physics", "2026-03-25", 5, 4, 600)
    response = client.post(
        "/sessions",
        json={
            "subject_id": subject["id"],
            "actual_minutes": 90,
            "started_at": datetime(2026, 3, 11, 15, 0).isoformat(),
            "completed_at": datetime(2026, 3, 11, 16, 30).isoformat(),
            "notes": "Solved practice questions",
        },
        headers={"X-User-Id": "demo-user"},
    )
    assert response.status_code == 201

    progress = client.get("/progress/subjects", headers={"X-User-Id": "demo-user"})
    assert progress.status_code == 200
    item = next(row for row in progress.json() if row["subject_id"] == subject["id"])
    assert item["completed_minutes"] == 90