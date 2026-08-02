from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

from app.dsa.leetcode_service import fetch_leetcode_profile
from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.pipelines.company_mapper import get_company_intelligence
from app.dsa.pipelines.topic_analyzer import analyze_topics
from app.dsa.pipelines.recommendation_engine import generate_recommended_questions
from app.dsa.pipelines.roadmap_generator import generate_weekly_roadmap
from app.dsa.pipelines.company_readiness import compute_company_readiness
from app.dsa.pipelines.ai_mentor import generate_ai_mentor_guidance
from app.dsa.question_dataset import load_questions
from app.dsa.repository import DSARepository, DSARepositoryError, DSAStatelessModeError
from app.dsa.solved_questions import infer_solved_question_slugs

logger = logging.getLogger("dsa.analytics_service")


class DSAAnalyticsService:
    """Orchestrates the full DSA Intelligence Engine pipeline."""

    def __init__(self, repo: DSARepository, gemini_model: Any = None):
        self._repo = repo
        self._gemini_model = gemini_model

    async def build_dashboard(
        self,
        *,
        username: str,
        company: str,
        domain: str,
    ) -> Dict[str, Any]:
        profile_data = await fetch_leetcode_profile(username)
        analytics = analyze_profile_stats(profile_data)

        company_data = get_company_intelligence(company)
        topic_analysis = analyze_topics(analytics, company_data)

        solved_slugs = infer_solved_question_slugs(
            profile_data=profile_data,
            questions=load_questions(),
        )
        weak_topics = topic_analysis.get("weak_topics", [])

        recommended_questions = generate_recommended_questions(
            weak_topics=weak_topics,
            solved_questions=solved_slugs,
            company=company_data["company"],
            total=20,
        )

        roadmap = generate_weekly_roadmap(
            weak_topics=weak_topics,
            company=company_data["company"],
            domain=domain,
            questions=recommended_questions,
        )

        readiness = compute_company_readiness(
            analytics=analytics,
            weak_topics=weak_topics,
        )

        ai_mentor = await generate_ai_mentor_guidance(
            gemini_model=self._gemini_model,
            analytics=analytics,
            weak_topics=weak_topics,
            roadmap=roadmap,
            readiness=readiness,
        )

        roadmap_id = f"roadmap_{username}_{int(datetime.utcnow().timestamp())}"

        # Optional persistence (no-op when stateless)
        try:
            await self._repo.save_roadmap_progress(
                username=username,
                roadmap_id=roadmap_id,
                roadmap_payload=roadmap,
            )
            await self._repo.save_company_readiness(
                username=username,
                company=company_data["company"],
                domain=domain,
                readiness_score=readiness["score"],
                explanation=readiness["explanation"],
                factors=readiness["factors"],
            )
        except DSAStatelessModeError:
            logger.info("DSA persistence skipped: stateless mode enabled")
        except DSARepositoryError as exc:
            logger.warning("DSA persistence failed after analytics generation: %s", exc)

        return {
            "username": profile_data.get("username", username),
            "realName": profile_data.get("profile", {}).get("realName") or username,
            "avatar": profile_data.get("profile", {}).get("userAvatar"),
            "ranking": profile_data.get("profile", {}).get("ranking"),
            "stats": analytics["stats"],
            "placementReadiness": analytics["placementReadiness"],
            "topics": analytics["topics"],
            "recommendations": [],
            "recommended_topics": weak_topics,
            "recommended_questions": recommended_questions,
            "roadmap": roadmap,
            "company_readiness": readiness,
            "weak_topics": weak_topics,
            "strong_topics": topic_analysis.get("strong_topics", []),
            "missing_topics": topic_analysis.get("missing_topics", []),
            "topic_scores": topic_analysis.get("topic_scores", []),
            "company_intelligence": company_data,
            "ai_mentor": ai_mentor,
            "roadmap_id": roadmap_id,
            "domain": domain,
            "company": company_data["company"],
        }

