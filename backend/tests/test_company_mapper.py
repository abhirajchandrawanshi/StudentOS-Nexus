from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dsa.pipelines.company_mapper import recommend_topics
from app.dsa.question_dataset import filter_questions, load_questions
from app.dsa.question_selection_engine import select_questions
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


def test_question_dataset_loader_filters_by_company_difficulty_and_topic():
    questions = load_questions()
    assert len(questions) >= 200

    filtered = filter_questions(company="Amazon", difficulty="Easy", topic="Arrays")
    assert filtered
    assert all("Amazon" in question["companies"] for question in filtered)
    assert all(question["difficulty"] == "Easy" for question in filtered)
    assert all("Arrays" in question["topics"] for question in filtered)


def test_question_selection_engine_returns_twenty_ranked_recommendations():
    recommendations = select_questions(
        company="Amazon",
        weak_topics=["Graphs", "DP"],
        completed_questions=[1, 2, 3],
    )

    assert len(recommendations) == 20
    assert {item["question"]["id"] for item in recommendations} == {item["question"]["id"] for item in recommendations}
    assert all(item["priority"] >= 1 for item in recommendations)
    assert all(item["difficulty"] in {"Easy", "Medium", "Hard"} for item in recommendations)
    assert all("reason" in item for item in recommendations)
    assert all("expected_time" in item for item in recommendations)
