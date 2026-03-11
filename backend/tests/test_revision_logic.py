from app.services.planner import REVISION_OFFSETS


def test_revision_blocks_appear_before_exam(client):
    client.post(
        "/subjects",
        json={
            "name": "Networks",
            "exam_date": "2026-03-20",
            "difficulty": 5,
            "priority": 5,
            "required_minutes": 800,
            "color": "#DC2626",
        },
        headers={"X-User-Id": "demo-user"},
    )

    response = client.post(
        "/planner/preview",
        json={"start_date": "2026-03-12", "end_date": "2026-03-20"},
        headers={"X-User-Id": "demo-user"},
    )
    assert response.status_code == 200
    blocks = response.json()["blocks"]
    revision_days = {block["block_date"] for block in blocks if block["block_type"] == "revision"}
    expected_days = {"2026-03-13", "2026-03-17", "2026-03-19"}
    assert expected_days.intersection(revision_days)
    assert REVISION_OFFSETS == (7, 3, 1)