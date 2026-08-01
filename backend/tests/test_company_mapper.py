from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dsa.pipelines.company_mapper import recommend_topics
from app.dsa.routes import router

app = FastAPI()
app.include_router(router, prefix="/dsa")
client = TestClient(app)


def test_recommend_topics_returns_ranked_topics_for_known_company():
    result = recommend_topics("Amazon")

    assert len(result) > 0
    assert result[0]["topic"] == "Arrays"
    assert result[0]["weight"] >= result[-1]["weight"]
    assert "difficulty_distribution" in result[0]


def test_recommend_topics_returns_empty_for_unknown_company():
    result = recommend_topics("Unknown Company")

    assert result == []


def test_company_topics_endpoint_returns_ranking_payload():
    response = client.get("/dsa/company-topics/Amazon")

    assert response.status_code == 200
    payload = response.json()
    assert payload["company"] == "Amazon"
    assert payload["topics"][0]["topic"] == "Arrays"
