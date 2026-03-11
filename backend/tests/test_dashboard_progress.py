from datetime import datetime


def seed_subjects(client):
    client.post(
        "/subjects",
        json={
            "name": "Math",
            "exam_date": "2026-03-18",
            "difficulty": 4,
            "priority": 5,
            "required_minutes": 600,
            "color": "#4F46E5",
        },
        headers={"X-User-Id": "demo-user"},
    )
    physics = client.post(
        "/subjects",
        json={
            "name": "Physics",
            "exam_date": "2026-03-22",
            "difficulty": 5,
            "priority": 4,
            "required_minutes": 800,
            "color": "#059669",
        },
        headers={"X-User-Id": "demo-user"},
    ).json()
    return physics["id"]


def test_progress_and_dashboard(client):
    physics_id = seed_subjects(client)
    client.post(
        "/sessions",
        json={
            "subject_id": physics_id,
            "actual_minutes": 120,
            "started_at": datetime(2026, 3, 11, 10, 0).isoformat(),
            "completed_at": datetime(2026, 3, 11, 12, 0).isoformat(),
            "notes": "Focused review",
        },
        headers={"X-User-Id": "demo-user"},
    )

    progress = client.get("/progress/subjects", headers={"X-User-Id": "demo-user"})
    assert progress.status_code == 200
    rows = progress.json()
    physics = next(item for item in rows if item["subject_name"] == "Physics")
    assert physics["completed_minutes"] == 120

    dashboard = client.get("/dashboard/summary", headers={"X-User-Id": "demo-user"})
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data["total_subjects"] == 2