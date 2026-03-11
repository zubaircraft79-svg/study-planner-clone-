from datetime import date


def create_subject(client):
    response = client.post(
        "/subjects",
        json={
            "name": "Algorithms",
            "exam_date": "2026-03-25",
            "difficulty": 5,
            "priority": 5,
            "required_minutes": 900,
            "color": "#2563EB",
        },
        headers={"X-User-Id": "demo-user"},
    )
    return response.json()["id"]


def test_lock_preserved_on_regenerate(client):
    create_subject(client)
    client.post(
        "/planner/generate-and-save",
        json={"start_date": "2026-03-12", "end_date": "2026-03-20"},
        headers={"X-User-Id": "demo-user"},
    )

    blocks = client.get("/blocks?start=2026-03-12&end=2026-03-20", headers={"X-User-Id": "demo-user"}).json()
    assert blocks
    block_id = blocks[0]["id"]

    client.patch(f"/blocks/{block_id}", json={"locked": True}, headers={"X-User-Id": "demo-user"})

    client.post(
        "/planner/generate-and-save",
        json={"start_date": "2026-03-12", "end_date": "2026-03-20"},
        headers={"X-User-Id": "demo-user"},
    )

    blocks_after = client.get("/blocks?start=2026-03-12&end=2026-03-20", headers={"X-User-Id": "demo-user"}).json()
    assert any(block["locked"] for block in blocks_after)