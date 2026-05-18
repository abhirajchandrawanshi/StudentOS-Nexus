from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# ─── EXISTING SCHEMAS (Dashboard profile fetch) ───────────────────────

class LeetCodeStats(BaseModel):
    all: int
    easy: int
    medium: int
    hard: int

class TopicStats(BaseModel):
    topic: str
    solved: int
    total: int
    color: str

class DSARecommendation(BaseModel):
    id: int
    type: str
    icon: str
    color: str
    bg: str
    border: str
    title: str
    desc: str
    action: str
    path: str

class DSAProfileResponse(BaseModel):
    username: str
    realName: Optional[str] = None
    avatar: Optional[str] = None
    ranking: Optional[int] = None
    stats: LeetCodeStats
    placementReadiness: float
    topics: List[TopicStats]
    recommendations: List[DSARecommendation]


# ─── NEW SCHEMAS (AI Gap Analysis & Sheet Generator) ──────────────────

class ExtractedSkills(BaseModel):
    careerDomain: str
    primaryLanguages: List[str]
    techStack: List[str]

class ResumeUploadResponse(BaseModel):
    filename: str
    status: str
    extractedSkills: ExtractedSkills

class GapAnalysisRequest(BaseModel):
    username: str
    extractedSkills: ExtractedSkills
    targetCompanies: List[str]
    focusIntensity: Optional[str] = "immediate"

class GapAnalysisReport(BaseModel):
    inferredCompanyPatterns: str
    readinessAssessment: str
    dynamicTopicPriorities: Dict[str, int]

class GapAnalysisResponse(BaseModel):
    username: str
    timestamp: str
    analysis: GapAnalysisReport

class RoadmapGenerateRequest(BaseModel):
    username: str
    dynamicTopicPriorities: Dict[str, int]
    totalQuestionsCount: Optional[int] = 30
    difficultyPreference: Optional[str] = "balanced"
    targetCompanies: Optional[List[str]] = []

class QuestionItem(BaseModel):
    questionId: int = Field(..., alias="id")
    title: str
    titleSlug: str
    difficulty: str
    topic: str
    companyTags: List[str]
    url: str
    masteryStatus: str = "unsolved"

    class Config:
        # Allows reading fields by alias or original field name
        populate_by_name = True

class RoadmapGenerateResponse(BaseModel):
    roadmapId: str
    totalQuestions: int
    topicDistribution: Dict[str, int]
    questions: List[QuestionItem]
