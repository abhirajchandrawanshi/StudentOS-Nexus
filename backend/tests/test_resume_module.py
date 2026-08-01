import unittest
from unittest.mock import patch
from app.resume.schemas import (
    ParsedResume,
    RawResumeText,
    ResumeAnalysisReport,
)
from app.resume.pipelines.skill_analyzer import analyze_skills
from app.resume.pipelines.ats_scorer import score_ats
from app.resume.pipelines.semantic_scorer import score_semantic
from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
from app.resume.service import ResumeAnalysisService
from app.resume.repository import ResumeRepository
from app.resume.routes import list_supported_domains


class ResumeModuleTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.raw_text = (
            "Experienced Python backend developer with FastAPI, PostgreSQL, and Docker. "
            "Contact: test@example.com. LinkedIn: linkedin.com/in/test-user. "
            "SKILLS\nPython, FastAPI, PostgreSQL, Docker\n"
            "EXPERIENCE\nBuilt scalable REST APIs and automated deployments.\n"
            "PROJECTS\nInventory management system using FastAPI and PostgreSQL.\n"
        )
        self.parsed = ParsedResume(
            raw_text=self.raw_text,
            word_count=len(self.raw_text.split()),
            page_count=1,
            summary="Backend developer with production API experience.",
            skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            experience=[
                {
                    "company": "Example Corp",
                    "role": "Backend Developer",
                    "duration": "Jan 2023 - Present",
                    "description": "Built scalable REST APIs and improved service reliability.",
                    "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                }
            ],
            projects=[
                {
                    "name": "Inventory System",
                    "description": "Developed inventory tracking with FastAPI and PostgreSQL.",
                    "technologies": ["FastAPI", "PostgreSQL", "Docker"],
                }
            ],
            education=[],
            certifications=[],
            email_found=True,
            phone_found=False,
            linkedin_found=True,
            github_found=False,
        )

    async def test_domain_list_response(self):
        response = await list_supported_domains()
        self.assertGreater(len(response.domains), 0)
        self.assertEqual(response.count, len(response.domains))

    def test_skill_analysis_fields(self):
        skill_result = analyze_skills(self.parsed, "Backend Developer")
        self.assertGreaterEqual(skill_result.domain_match_pct, 0.0)
        self.assertLessEqual(skill_result.domain_match_pct, 100.0)
        self.assertIsInstance(skill_result.missing_skills, list)
        self.assertIsInstance(skill_result.keyword_analysis.found_keywords, list)
        self.assertIsInstance(skill_result.keyword_analysis.missing_keywords, list)
        self.assertIsInstance(skill_result.keyword_analysis.keyword_density, float)

    def test_ats_scoring_fields(self):
        skill_result = analyze_skills(self.parsed, "Backend Developer")
        ats_result = score_ats(self.parsed, skill_result)
        self.assertGreaterEqual(ats_result.ats_score, 0.0)
        self.assertLessEqual(ats_result.ats_score, 100.0)
        self.assertIsInstance(ats_result.breakdown.keyword_score, float)
        self.assertIsInstance(ats_result.weak_sections, list)
        self.assertIsInstance(ats_result.formatting_suggestions, list)

    def test_achievements_extraction(self):
        from app.resume.pipelines.section_extractor import parse_resume_sections

        raw_text = (
            "ACHIEVEMENTS\n"
            "- Reduced build time by 40%\n"
            "- Improved test coverage to 95%\n"
        )
        parsed = parse_resume_sections(RawResumeText(full_text=raw_text, page_count=1, has_tables=False, extraction_method="pdfplumber"))
        self.assertEqual(parsed.achievements, ["Reduced build time by 40%", "Improved test coverage to 95%"])

    @patch("app.resume.pipelines.semantic_scorer._get_model", return_value=None)
    def test_semantic_scoring_fallback(self, _mock_model):
        semantic_result = score_semantic(self.parsed, "Backend Developer")
        self.assertEqual(semantic_result.semantic_match_score, 0.0)
        self.assertGreaterEqual(semantic_result.project_relevance_avg, 0.0)
        self.assertIsInstance(semantic_result.project_relevance, list)

    @patch("app.resume.pipelines.semantic_scorer._get_model", return_value=None)
    async def test_gemini_fallback_insights(self, _mock_model):
        skill_result = analyze_skills(self.parsed, "Backend Developer")
        ats_result = score_ats(self.parsed, skill_result)
        semantic_result = score_semantic(self.parsed, "Backend Developer")
        insights = await analyze_with_gemini(None, self.parsed, "Backend Developer", skill_result, ats_result, semantic_result)
        self.assertIsNotNone(insights.ai_summary)
        self.assertIsInstance(insights.top_strengths, list)
        self.assertIsInstance(insights.top_improvements, list)
        self.assertGreaterEqual(insights.gemini_holistic_score, 0.0)
        self.assertLessEqual(insights.gemini_holistic_score, 100.0)

    @patch("app.resume.service.extract_pdf_text")
    @patch("app.resume.service.parse_resume_sections")
    async def test_resume_analysis_service_pipeline(self, mock_parse_sections, mock_extract_text):
        mock_extract_text.return_value = RawResumeText(
            full_text=self.raw_text,
            page_count=1,
            has_tables=False,
            extraction_method="pdfplumber",
        )
        mock_parse_sections.return_value = self.parsed

        service = ResumeAnalysisService(repository=ResumeRepository(session=None), gemini_model=None)
        report = await service.analyze(
            file_bytes=b"fake pdf bytes",
            filename="test_resume.pdf",
            target_domain="Backend Developer",
            user_id="test-user",
        )

        self.assertIsInstance(report, ResumeAnalysisReport)
        self.assertEqual(report.target_domain, "Backend Developer")
        self.assertTrue(0.0 <= report.ats_score <= 100.0)
        self.assertTrue(0.0 <= report.domain_match_pct <= 100.0)
        self.assertTrue(0.0 <= report.semantic_match_score <= 1.0)
        self.assertIsInstance(report.matched_skills, list)
        self.assertIsInstance(report.missing_skills, list)
        self.assertIsInstance(report.keyword_analysis.found_keywords, list)
        self.assertIsInstance(report.project_relevance, list)
        self.assertIsInstance(report.gemini_insights, object)
        self.assertIsInstance(report.formatting_suggestions, list)

    async def test_rewrite_resume_with_gemini_requires_model(self):
        from app.resume.pipelines.gemini_analyzer import rewrite_resume_with_gemini

        with self.assertRaises(ValueError):
            await rewrite_resume_with_gemini(None, self.raw_text, "Backend Developer")

    async def test_rewrite_resume_with_gemini_stub_model(self):
        from app.resume.pipelines.gemini_analyzer import rewrite_resume_with_gemini

        class FakeResponse:
            def __init__(self, text):
                self.text = text

        class FakeModel:
            def generate_content(self, prompt):
                return FakeResponse("```markdown\n# Rewritten Resume\n- Experience: Improved APIs\n```")

        rewritten = await rewrite_resume_with_gemini(FakeModel(), self.raw_text, "Backend Developer")
        self.assertIn("# Rewritten Resume", rewritten)
        self.assertNotIn("```", rewritten)


if __name__ == "__main__":
    unittest.main()
