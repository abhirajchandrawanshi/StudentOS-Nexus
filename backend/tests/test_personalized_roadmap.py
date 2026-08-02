from app.dsa.personalized_roadmap import generate_personalized_roadmap


def test_generate_personalized_roadmap_has_eight_weeks():
    roadmap = generate_personalized_roadmap(
        leetcodeAnalytics={
            "stats": {"easy": 20, "medium": 15, "hard": 5},
            "topics": [{"topic": "Arrays", "solved": 10, "total": 20}],
        },
        targetCompany="Amazon",
        targetDomain="Backend Development",
        weakTopics=["Graphs", "DP"],
    )

    assert roadmap["duration_weeks"] == 8
    assert len(roadmap["weeks"]) == 8

    first_week = roadmap["weeks"][0]
    assert first_week["topics"]
    assert len(first_week["questions"]) >= 2
    assert first_week["estimated_hours"] >= 4
    assert first_week["milestone"]
    assert first_week["difficulty"]
    assert first_week["learning_objective"]
