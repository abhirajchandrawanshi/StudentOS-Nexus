from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dsa.dependencies import get_dsa_repo
from app.dsa.repository import DSAStatelessModeError
from app.dsa.routes import router


class DummyRepo:
    async def save_question_completion(self, **kwargs):
        raise DSAStatelessModeError("stateless")

    async def get_question_history(self, **kwargs):
        return []

    async def get_latest_roadmap(self, **kwargs):
        return None


def _build_app() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/dsa")
    app.dependency_overrides[get_dsa_repo] = lambda: DummyRepo()
    return TestClient(app)


def test_history_route_exists_and_returns_schema_shape() -> None:
    client = _build_app()
    res = client.get("/dsa/history", params={"username": "demo"})
    assert res.status_code == 200
    body = res.json()
    assert body["username"] == "demo"
    assert "items" in body
    assert "total" in body


def test_complete_question_route_stateless_ok() -> None:
    client = _build_app()
    res = client.post(
        "/dsa/questions/10/complete",
        json={"username": "demo", "status": "completed"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["message"] == "Stateless mode: completion accepted"
