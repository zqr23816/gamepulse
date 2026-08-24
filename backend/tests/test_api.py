from fastapi.testclient import TestClient

from gamepulse.main import create_app


def test_batch_ingestion_is_idempotent(tmp_path) -> None:
    app = create_app(str(tmp_path / "test.db"))
    headers = {"X-API-Key": "gamepulse-demo-key", "Idempotency-Key": "request-001"}
    body = {"events": [{"type": "session.started", "playerId": "player_nova", "payload": {"build": "1.4.2"}}]}
    with TestClient(app) as client:
        first = client.post("/api/v1/events/batch", headers=headers, json=body)
        second = client.post("/api/v1/events/batch", headers=headers, json=body)
    assert first.status_code == 202
    assert first.json()["replayed"] is False
    assert second.json()["replayed"] is True
    assert first.json()["eventIds"] == second.json()["eventIds"]


def test_leaderboard_requires_api_key(tmp_path) -> None:
    app = create_app(str(tmp_path / "test.db"))
    with TestClient(app) as client:
        assert client.get("/api/v1/leaderboard").status_code == 422
        response = client.get("/api/v1/leaderboard", headers={"X-API-Key": "gamepulse-demo-key"})
    assert response.status_code == 200
    assert response.json()[0]["displayName"] == "NovaFox"


