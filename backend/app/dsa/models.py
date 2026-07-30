from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict

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
    percentage: Optional[float] = None
    rank: Optional[int] = None
    status: Optional[str] = None

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

class ContestStats(BaseModel):
    rating: int = 0
    globalRanking: int = 0
    topPercentage: int = 0
    contestsAttended: int = 0

class RecentSubmission(BaseModel):
    title: Optional[str] = None
    titleSlug: Optional[str] = None
    timestamp: Optional[int] = None
    status: Optional[str] = None

class DSAProfileResponse(BaseModel):
    username: str
    realName: Optional[str] = None
    avatar: Optional[str] = None
    ranking: Optional[int] = None
    stats: LeetCodeStats
    placementReadiness: float
    topics: List[TopicStats]
    recommendations: List[DSARecommendation]
    contest: ContestStats = ContestStats()
    recentSubmissions: List[RecentSubmission] = []
    submissionCalendar: Dict[str, int] = {}
    distribution: Optional[Dict[str, float]] = None
    readiness: Optional[Dict[str, Any]] = None
    topicAnalytics: Optional[Dict[str, Any]] = None
    learningRoadmap: Optional[List[Dict[str, Any]]] = None


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


# ─── ANALYTICS DASHBOARD SCHEMAS ───────────────────────────────────────

class DifficultyBreakdown(BaseModel):
    difficulty: str
    count: int
    percentage: float
    color: str

class TopicMastery(BaseModel):
    name: str
    solved: int
    total: int
    percentage: float
    color: str

class ActivityData(BaseModel):
    date: str
    count: int

class DifficultyTrendData(BaseModel):
    month: str
    easy: int
    medium: int
    hard: int

class DashboardAnalytics(BaseModel):
    username: str
    totalSolved: int
    difficultyBreakdown: List[DifficultyBreakdown]
    problemSolvingDistribution: Dict[str, float] = {}
    topicMastery: List[TopicMastery]
    placementReadiness: float
    readiness: Optional[Dict[str, Any]] = None
    topicAnalytics: Optional[Dict[str, Any]] = None
    recommendations: List[DSARecommendation] = []
    learningRoadmap: List[Dict[str, Any]] = []
    weeklyActivity: List[ActivityData]
    monthlyTrend: List[DifficultyTrendData]
    heatmapData: Dict[str, int]
