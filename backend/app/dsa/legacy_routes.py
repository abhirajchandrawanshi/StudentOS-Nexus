import logging
import os
import shutil
import tempfile
from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.dsa.ai_gap_analyzer import analyze_gap_and_priorities, parse_resume_skills_with_ai
from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.leetcode_service import fetch_leetcode_profile
from app.dsa.models import (
    ExtractedSkills,
    GapAnalysisReport,
    GapAnalysisRequest,
    GapAnalysisResponse,
    ResumeUploadResponse,
)

logger = logging.getLogger("dsa_legacy_routes")
logger.setLevel(logging.INFO)

legacy_router = APIRouter()


@legacy_router.post("/resume/upload", response_model=ResumeUploadResponse)
async def upload_resume_and_extract_skills(file: UploadFile = File(...)):
    """
    Endpoint that handles PDF resume uploads.
    Extracts developer career domain, primary programming languages, and tech stack.
    """
    logger.info("Received resume upload request: %s", file.filename)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resume files are supported.")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        extracted = await parse_resume_skills_with_ai(tmp_path)

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        skills_obj = ExtractedSkills(
            careerDomain=extracted.get("careerDomain", "General Software Engineering"),
            primaryLanguages=extracted.get("primaryLanguages", []),
            techStack=extracted.get("techStack", []),
        )

        logger.info("Successfully extracted resume skills for file: %s", file.filename)
        return ResumeUploadResponse(
            filename=file.filename,
            status="success",
            extractedSkills=skills_obj,
        )

    except Exception as exc:
        logger.error("Error occurred during resume parsing: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while extracting skills from the resume: {str(exc)}",
        )


@legacy_router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def trigger_ai_gap_analysis(request: GapAnalysisRequest):
    """
    Endpoint that combines LeetCode coverage, resume skills, and target companies
    to perform a dynamic AI Gap Analysis.
    Calculates precise, dynamic topic priority percentages summing to exactly 100%.
    """
    logger.info("Received gap analysis request for: %s", request.username)

    try:
        profile_data = await fetch_leetcode_profile(request.username)
        analyzed = analyze_profile_stats(profile_data)

        skills_dict = {
            "careerDomain": request.extractedSkills.careerDomain,
            "primaryLanguages": request.extractedSkills.primaryLanguages,
            "techStack": request.extractedSkills.techStack,
        }

        report = await analyze_gap_and_priorities(
            leetcode_topics=analyzed["topics"],
            resume_skills=skills_dict,
            target_companies=request.targetCompanies,
        )

        analysis_report = GapAnalysisReport(
            inferredCompanyPatterns=report["inferredCompanyPatterns"],
            readinessAssessment=report["readinessAssessment"],
            dynamicTopicPriorities=report["dynamicTopicPriorities"],
        )

        response = GapAnalysisResponse(
            username=request.username,
            timestamp=datetime.utcnow().isoformat() + "Z",
            analysis=analysis_report,
        )

        logger.info("Successfully completed gap analysis for '%s'", request.username)
        return response

    except Exception as exc:
        logger.error("Error conducting gap analysis for '%s': %s", request.username, exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while performing RAG gap analysis: {str(exc)}",
        )
