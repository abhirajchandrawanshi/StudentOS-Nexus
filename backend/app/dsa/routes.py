import logging
import tempfile
import os
import shutil
from datetime import datetime
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Response

from app.dsa.models import (
    DSAProfileResponse,
    ResumeUploadResponse,
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisReport,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    QuestionItem,
    ExtractedSkills,
    DashboardAnalytics
)
from app.dsa.leetcode_service import (
    LeetCodeServiceError,
    LeetCodeUserNotFoundError,
    fetch_leetcode_profile,
)
from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.recommendation_engine import (
    generate_dsa_recommendations,
    generate_dynamic_leetcode_sheet
)
from app.dsa.utils.excel_generator import generate_dsa_spreadsheet_bytes

logger = logging.getLogger("dsa_routes")
logger.setLevel(logging.INFO)

router = APIRouter()

# In-memory storage for active roadmap plans generated during the session.
# Allows the Export endpoint to retrieve questions by UUID instantly without a full database.
ACTIVE_ROADMAPS: Dict[str, Dict[str, Any]] = {}


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
        logger.info("Parser output stats for '%s': %s", username, profile_data.get("stats"))
        
        # 2. Extract difficulty stats, calculate readiness score, and aggregate curriculum tracks
        analyzed = analyze_profile_stats(profile_data)
        logger.info("Analytics output stats for '%s': %s", username, analyzed.get("stats"))
        
        # 3. Generate actionable, visual recommendations
        recommendations = generate_dsa_recommendations(analyzed)
        
        # 4. Construct unified response payload matching the models schema
        response = DSAProfileResponse(
            username=profile_data.get("username", username),
            realName=profile_data.get("profile", {}).get("realName") or username,
            avatar=profile_data.get("profile", {}).get("avatar"),
            ranking=profile_data.get("profile", {}).get("ranking"),
            stats=analyzed["stats"],
            placementReadiness=analyzed["placementReadiness"],
            topics=analyzed["topics"],
            recommendations=recommendations,
            contest=profile_data.get("contest", {}),
            recentSubmissions=profile_data.get("recentSubmissions", []),
            submissionCalendar=profile_data.get("submissionCalendar", {})
        )
        logger.info("Final response stats for '%s': %s", username, response.stats.model_dump())
        
        logger.info(f"Successfully compiled DSA profile payload for '{username}'")
        return response
        
    except LeetCodeUserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except LeetCodeServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    except Exception as e:
        logger.error(f"Error handling profile request for '{username}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while compiling the DSA section profile: {str(e)}"
        )


@router.get("/analytics/{username}", response_model=DashboardAnalytics)
async def get_dsa_analytics_dashboard(username: str):
    """
    Fetches comprehensive DSA analytics data for the dashboard.
    Includes difficulty breakdown, topic mastery, activity trends, and heatmap data.
    """
    logger.info(f"Received analytics request for: {username}")
    
    if not username or username.strip() == "":
        raise HTTPException(status_code=400, detail="Username cannot be empty")
        
    try:
        # Fetch profile and analyze stats
        profile_data = await fetch_leetcode_profile(username)
        analyzed = analyze_profile_stats(profile_data)
        stats = analyzed["stats"]
        topics = analyzed["topics"]
        placement_readiness = analyzed["placementReadiness"]
        
        # Calculate total solved
        total_solved = stats["all"]
        
        # Build difficulty breakdown
        total = stats["easy"] + stats["medium"] + stats["hard"]
        difficulty_breakdown = [
            {
                "difficulty": "Easy",
                "count": stats["easy"],
                "percentage": round((stats["easy"] / total * 100) if total > 0 else 0, 1),
                "color": "#10b981"
            },
            {
                "difficulty": "Medium",
                "count": stats["medium"],
                "percentage": round((stats["medium"] / total * 100) if total > 0 else 0, 1),
                "color": "#f59e0b"
            },
            {
                "difficulty": "Hard",
                "count": stats["hard"],
                "percentage": round((stats["hard"] / total * 100) if total > 0 else 0, 1),
                "color": "#ef4444"
            }
        ]
        
        # Build topic mastery
        topic_mastery = []
        for topic in topics:
            topic_mastery.append({
                "name": topic["topic"],
                "solved": topic["solved"],
                "total": topic["total"],
                "percentage": round((topic["solved"] / topic["total"] * 100) if topic["total"] > 0 else 0, 1),
                "color": topic["color"]
            })
        
        # Sort by percentage descending
        topic_mastery.sort(key=lambda x: x["percentage"], reverse=True)
        
        # Generate mock weekly activity (calendar data)
        weekly_activity = []
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        # Distribute solved questions across the week
        base_per_day = total_solved // 7 if total_solved > 0 else 0
        remainder = total_solved % 7 if total_solved > 0 else 0
        
        for i, day in enumerate(days):
            count = base_per_day + (1 if i < remainder else 0)
            weekly_activity.append({
                "date": day,
                "count": max(0, count)
            })
        
        # Generate mock monthly trend (last 5 months)
        monthly_trend = []
        months = ["Jan", "Feb", "Mar", "Apr", "May"]
        total_distributed = total_solved
        
        for month in months:
            # Distribute solved questions across months
            easy_portion = int((stats["easy"] / total) * total_distributed / 5) if total > 0 else 0
            medium_portion = int((stats["medium"] / total) * total_distributed / 5) if total > 0 else 0
            hard_portion = int((stats["hard"] / total) * total_distributed / 5) if total > 0 else 0
            
            monthly_trend.append({
                "month": month,
                "easy": easy_portion,
                "medium": medium_portion,
                "hard": hard_portion
            })
        
        # Generate heatmap data (7x4 grid for week x difficulty progression)
        heatmap_data = {}
        for i in range(7):
            for j in range(4):
                key = f"w{i}_d{j}"
                # Generate intensity based on some distribution
                heatmap_data[key] = (i + j) % 10
        
        response = DashboardAnalytics(
            username=username,
            totalSolved=total_solved,
            difficultyBreakdown=difficulty_breakdown,
            topicMastery=topic_mastery,
            placementReadiness=placement_readiness,
            weeklyActivity=weekly_activity,
            monthlyTrend=monthly_trend,
            heatmapData=heatmap_data
        )
        
        logger.info(f"Successfully compiled analytics for '{username}'")
        return response
        
    except LeetCodeUserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except LeetCodeServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting analytics for '{username}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching analytics: {str(e)}"
        )


@router.post("/resume/upload", response_model=ResumeUploadResponse)
async def upload_resume_and_extract_skills(file: UploadFile = File(...)):
    """
    Endpoint that handles PDF resume uploads.
    Extracts developer career domain, primary programming languages, and tech stack.
    """
    logger.info(f"Received resume upload request: {file.filename}")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resume files are supported.")
        
    # Write to a temporary file safely
    try:
        from app.dsa.ai_gap_analyzer import parse_resume_skills_with_ai

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # Invoke our AI parsing engine
        extracted = await parse_resume_skills_with_ai(tmp_path)
        
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
        skills_obj = ExtractedSkills(
            careerDomain=extracted.get("careerDomain", "General Software Engineering"),
            primaryLanguages=extracted.get("primaryLanguages", []),
            techStack=extracted.get("techStack", [])
        )
        
        logger.info(f"Successfully extracted resume skills for file: {file.filename}")
        return ResumeUploadResponse(
            filename=file.filename,
            status="success",
            extractedSkills=skills_obj
        )
        
    except Exception as e:
        logger.error(f"Error occurred during resume parsing: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while extracting skills from the resume: {str(e)}"
        )


@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def trigger_ai_gap_analysis(request: GapAnalysisRequest):
    """
    Endpoint that combines LeetCode coverage, resume skills, and target companies
    to perform a dynamic AI Gap Analysis.
    Calculates precise, dynamic topic priority percentages summing to exactly 100%.
    """
    logger.info(f"Received gap analysis request for: {request.username}")
    
    try:
        from app.dsa.ai_gap_analyzer import analyze_gap_and_priorities

        # 1. Fetch LeetCode stats to evaluate weakness percentages
        profile_data = await fetch_leetcode_profile(request.username)
        analyzed = analyze_profile_stats(profile_data)
        
        # 2. Trigger the gap analysis reasoner
        skills_dict = {
            "careerDomain": request.extractedSkills.careerDomain,
            "primaryLanguages": request.extractedSkills.primaryLanguages,
            "techStack": request.extractedSkills.techStack
        }
        
        report = await analyze_gap_and_priorities(
            leetcode_topics=analyzed["topics"],
            resume_skills=skills_dict,
            target_companies=request.targetCompanies
        )
        
        analysis_report = GapAnalysisReport(
            inferredCompanyPatterns=report["inferredCompanyPatterns"],
            readinessAssessment=report["readinessAssessment"],
            dynamicTopicPriorities=report["dynamicTopicPriorities"]
        )
        
        response = GapAnalysisResponse(
            username=request.username,
            timestamp=datetime.utcnow().isoformat() + "Z",
            analysis=analysis_report
        )
        
        logger.info(f"Successfully completed gap analysis for '{request.username}'")
        return response
        
    except Exception as e:
        logger.error(f"Error conducting gap analysis for '{request.username}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while performing RAG gap analysis: {str(e)}"
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
        solved_slugs = []
        tag_pools = profile_data.get("tagProblemCounts", {})
        for pool in ["fundamental", "intermediate", "advanced"]:
            for item in tag_pools.get(pool, []):
                if item.get("problemsSolved", 0) > 0:
                    solved_slugs.append(item.get("tagSlug", ""))
                    
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
