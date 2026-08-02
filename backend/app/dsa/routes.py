import logging
from datetime import datetime
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, Response, Depends, Query

from app.dsa.models import (
    DSAProfileResponse,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    QuestionItem,
    AnalyticsDashboardResponse,
    QuestionCompleteRequest,
    QuestionCompleteResponse,
    QuestionHistoryResponse,
    QuestionHistoryItem,
)
from app.dsa.leetcode_service import fetch_leetcode_profile
from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.recommendation_engine import (
    generate_dsa_recommendations,
    generate_dynamic_leetcode_sheet
)
from app.dsa.analytics_service import DSAAnalyticsService
from app.dsa.dependencies import get_dsa_repo, get_dsa_gemini_client
from app.dsa.question_bank import get_all_questions
from app.dsa.repository import DSARepository, DSARepositoryError, DSAStatelessModeError
from app.dsa.solved_questions import infer_solved_question_slugs
from app.dsa.utils.excel_generator import generate_dsa_spreadsheet_bytes

logger = logging.getLogger("dsa_routes")
logger.setLevel(logging.INFO)

router = APIRouter()

# In-memory storage for active roadmap plans generated during the session.
# Allows the Export endpoint to retrieve questions by UUID instantly without a full database.
ACTIVE_ROADMAPS: Dict[str, Dict[str, Any]] = {}


@router.get("/analytics/{username}", response_model=AnalyticsDashboardResponse)
async def get_dsa_analytics_dashboard(
    username: str,
    company: str = Query(default="Amazon"),
    domain: str = Query(default="Backend Developer"),
    repo: DSARepository = Depends(get_dsa_repo),
):
    """Unified analytics endpoint for dashboard insights, recommendations, roadmap, readiness, and AI mentor guidance."""
    if not username or username.strip() == "":
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    try:
        service = DSAAnalyticsService(repo=repo, gemini_model=get_dsa_gemini_client())
        payload = await service.build_dashboard(
            username=username,
            company=company,
            domain=domain,
        )
        return AnalyticsDashboardResponse(**payload)
    except Exception as exc:
        logger.error("Analytics dashboard generation failed for '%s': %s", username, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate analytics dashboard")


@router.get("/profile/{username}", response_model=DSAProfileResponse)
async def get_leetcode_profile_by_username(username: str):
    """
    Asynchronously fetches LeetCode profile stats, calculates readiness,
    topic tracks progression, and generates recommendations.
    """
    logger.info(f"Received request for LeetCode profile of username: {username}")
    
    if not username or username.strip() == "":
        raise HTTPException(status_code=400, detail="Username cannot be empty")
        
    try:
        # 1. Fetch raw data from LeetCode public API (or fallback mock representation)
        profile_data = await fetch_leetcode_profile(username)
        
        # 2. Extract difficulty stats, calculate readiness score, and aggregate curriculum tracks
        analyzed = analyze_profile_stats(profile_data)
        
        # 3. Generate actionable, visual recommendations
        recommendations = generate_dsa_recommendations(analyzed)
        
        # 4. Construct unified response payload matching the models schema
        response = DSAProfileResponse(
            username=profile_data.get("username", username),
            realName=profile_data.get("profile", {}).get("realName") or username,
            avatar=profile_data.get("profile", {}).get("userAvatar"),
            ranking=profile_data.get("profile", {}).get("ranking"),
            stats=analyzed["stats"],
            placementReadiness=analyzed["placementReadiness"],
            topics=analyzed["topics"],
            recommendations=recommendations
        )
        
        logger.info(f"Successfully compiled DSA profile payload for '{username}'")
        return response
        
    except Exception as e:
        logger.error(f"Error handling profile request for '{username}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while compiling the DSA section profile: {str(e)}"
        )


@router.post("/roadmap/generate", response_model=RoadmapGenerateResponse)
async def generate_placement_roadmap(request: RoadmapGenerateRequest):
    """
    Endpoint that generates a personalized question sheet based on topic priorities
    and placement readiness. Sorts/ranks problem options dynamically.
    """
    logger.info(f"Generating dynamic preparation sheet for: {request.username}")
    
    try:
        # 1. Fetch user's profile and solved stats
        profile_data = await fetch_leetcode_profile(request.username)
        analyzed = analyze_profile_stats(profile_data)
        
        # We can extract recent tag slug details or mock a small set of solved problems
        # to ensure the dynamic sheet does not recommend items the student completed
        solved_slugs = infer_solved_question_slugs(
            profile_data=profile_data,
            questions=get_all_questions(),
        )
                    
        # 2. Run the dynamic allocation picker
        questions = generate_dynamic_leetcode_sheet(
            username=request.username,
            priorities=request.dynamicTopicPriorities,
            total_q=request.totalQuestionsCount,
            readiness=analyzed["placementReadiness"],
            target_companies=request.targetCompanies,
            solved_questions_slugs=solved_slugs
        )
        
        # 3. Create active session details
        roadmap_id = f"sheet_{hash(request.username + str(datetime.now().timestamp())) & 0xffffffff:08x}"
        
        # Compute exact topic allocations count for response overview
        topic_dist = {}
        for q in questions:
            t = q["topic"]
            topic_dist[t] = topic_dist.get(t, 0) + 1
            
        # Map raw questions array to QuestionItem schemas
        mapped_questions = []
        for idx, q in enumerate(questions):
            mapped_questions.append(
                QuestionItem(
                    id=q["id"],
                    title=q["title"],
                    titleSlug=q["titleSlug"],
                    difficulty=q["difficulty"],
                    topic=q["topic"],
                    companyTags=q.get("companyTags", []),
                    url=q["url"],
                    masteryStatus="unsolved"
                )
            )
            
        # Persist sheet in-memory for immediate Excel export session
        ACTIVE_ROADMAPS[roadmap_id] = {
            "username": request.username,
            "questions": [q.dict(by_alias=True) for q in mapped_questions],
            "title": f"DSA Preparation Sheet - @{request.username}"
        }
        
        response = RoadmapGenerateResponse(
            roadmapId=roadmap_id,
            totalQuestions=len(mapped_questions),
            topicDistribution=topic_dist,
            questions=mapped_questions
        )
        
        logger.info(f"Successfully generated dynamic preparation sheet '{roadmap_id}' containing {len(mapped_questions)} questions")
        return response
        
    except Exception as e:
        logger.error(f"Error compiling dynamic preparation sheet for '{request.username}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while compiling dynamic coding roadmaps: {str(e)}"
        )


@router.get("/sheet/export/{roadmap_id}")
async def export_roadmap_to_spreadsheet(roadmap_id: str):
    """
    Endpoint that fetches a previously generated roadmap by ID,
    formats it, and streams a beautiful downloadable Excel sheet.
    """
    logger.info(f"Export sheet request for Roadmap ID: {roadmap_id}")
    
    if roadmap_id not in ACTIVE_ROADMAPS:
        raise HTTPException(
            status_code=404,
            detail="Requested DSA Preparation Sheet was not found or has expired. Please regenerate your roadmap."
        )
        
    try:
        roadmap_data = ACTIVE_ROADMAPS[roadmap_id]
        questions = roadmap_data["questions"]
        title = roadmap_data["title"]
        
        # Call spreadsheet generation utility
        file_bytes, mime_type, file_extension = generate_dsa_spreadsheet_bytes(questions, title)
        
        # Set attachment download header
        filename = f"StudentOS_DSA_Sheet_{roadmap_id}.{file_extension}"
        headers = {
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
        
        logger.info(f"Successfully compiled binary spreadsheet for sheet {roadmap_id} ({len(questions)} items)")
        return Response(content=file_bytes, media_type=mime_type, headers=headers)
        
    except Exception as e:
        logger.error(f"Failed exporting roadmap sheet {roadmap_id} to Excel: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during Excel workbook generation: {str(e)}"
        )


@router.post("/questions/{question_id}/complete", response_model=QuestionCompleteResponse)
async def mark_question_complete(
    question_id: int,
    request: QuestionCompleteRequest,
    repo: DSARepository = Depends(get_dsa_repo),
):
    """Persist question completion history when DB is configured; no-op success in stateless mode."""
    try:
        history_result = await repo.save_question_completion(
            username=request.username,
            question_id=question_id,
            status=request.status,
            topic=request.topic,
            difficulty=request.difficulty,
            company=request.company,
        )
        return QuestionCompleteResponse(
            success=True,
            message="Question completion recorded" if history_result.persisted else "Stateless mode: completion accepted",
            historyId=history_result.record_id,
        )
    except DSAStatelessModeError as exc:
        logger.warning("Stateless mode write request: %s", exc)
        return QuestionCompleteResponse(
            success=True,
            message="Stateless mode: completion accepted",
            historyId=None,
        )
    except DSARepositoryError as exc:
        logger.error("Failed to persist question completion: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database write failed while updating completion")
    except Exception as exc:
        logger.error("Failed to mark question as complete: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update question completion")


@router.get("/history", response_model=QuestionHistoryResponse)
async def get_history(
    username: str = Query(..., min_length=1),
    limit: int = Query(default=50, ge=1, le=200),
    repo: DSARepository = Depends(get_dsa_repo),
):
    """Return question completion history for a user."""
    rows = await repo.get_question_history(username=username, limit=limit)
    items = [
        QuestionHistoryItem(
            id=str(row.id),
            username=row.username,
            questionId=row.question_id,
            status=row.status,
            topic=row.topic,
            difficulty=row.difficulty,
            company=row.company,
            createdAt=row.created_at.isoformat(),
        )
        for row in rows
    ]
    return QuestionHistoryResponse(username=username, items=items, total=len(items))


@router.get("/roadmap")
async def get_latest_roadmap(
    username: str = Query(..., min_length=1),
    repo: DSARepository = Depends(get_dsa_repo),
):
    """Fetch latest saved roadmap for a user when persistence is enabled."""
    row = await repo.get_latest_roadmap(username=username)
    if row is None:
        return {
            "username": username,
            "roadmap": None,
            "message": "No persisted roadmap found (or stateless mode enabled).",
        }

    return {
        "username": username,
        "roadmapId": row.roadmap_id,
        "roadmap": row.roadmap_payload,
        "createdAt": row.created_at.isoformat(),
    }
