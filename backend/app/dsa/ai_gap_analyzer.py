import os
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv
import google.generativeai as genai
from pypdf import PdfReader

from app.dsa.company_mapper import aggregate_company_topic_priorities, get_company_profile

logger = logging.getLogger("dsa_ai_gap_analyzer")
logger.setLevel(logging.INFO)

# Load environment variables
load_dotenv()

# Configure Google Generative AI client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using the standard gemini-2.5-flash model as configured in app/rag/generator.py
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")
else:
    logger.warning("GEMINI_API_KEY not configured. Gap Analyzer will run in dynamic heuristic mode.")
    gemini_model = None


def extract_text_from_pdf(file_path: str) -> str:
    """
    Parses an uploaded PDF file and extracts all readable text using PyPDF.
    """
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF resume at {file_path}: {e}")
        return ""


async def parse_resume_skills_with_ai(file_path: str) -> Dict[str, Any]:
    """
    Extracts career domains, languages, and tech stack from a resume.
    Uses Gemini AI if configured, otherwise falls back to keyword matching.
    """
    pdf_text = extract_text_from_pdf(file_path)
    if not pdf_text or pdf_text.strip() == "":
        return {
            "careerDomain": "General Software Development",
            "primaryLanguages": ["Python", "JavaScript", "Java"],
            "techStack": ["FastAPI", "React", "PostgreSQL"]
        }

    # 1. ─── Call Gemini AI if API Key is configured ─────────────────────
    if gemini_model:
        prompt = f"""
        You are an expert technical recruiting AI. Analyze this candidate resume text and extract:
        1. Career Domain (e.g. Backend Development, Full-Stack Development, AI/ML Engineering, Mobile)
        2. Primary programming languages used (e.g. Python, C++, Java, JavaScript, Go)
        3. Tech stack & frameworks mentioned (e.g. FastAPI, PyTorch, React, Docker, Postgres, ChromaDB)

        You MUST respond ONLY with a valid JSON string conforming strictly to this schema:
        {{
          "careerDomain": "extracted career domain string",
          "primaryLanguages": ["lang1", "lang2"],
          "techStack": ["tech1", "tech2", "tech3"]
        }}

        Resume Text:
        {pdf_text[:8000]}
        """
        try:
            # We configure JSON generation to ensure it returns clean parseable data
            response = gemini_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            parsed = json.loads(response.text.strip())
            logger.info("Successfully parsed resume using Gemini AI")
            return parsed
        except Exception as e:
            logger.error(f"Failed parsing resume via Gemini: {e}. Falling back to heuristics.")

    # 2. ─── Fallback Local Semantic Keyword Matching Heuristics ─────────
    text_lower = pdf_text.lower()
    
    # Infer Domain
    domain = "Software Engineering"
    if "machine learning" in text_lower or "pytorch" in text_lower or "tensorflow" in text_lower or "data science" in text_lower:
        domain = "Machine Learning & AI Engineering"
    elif "frontend" in text_lower or "ui/ux" in text_lower or "react" in text_lower or "tailwind" in text_lower:
        domain = "Frontend Development"
    elif "backend" in text_lower or "database" in text_lower or "api" in text_lower or "fastapi" in text_lower or "spring boot" in text_lower:
        domain = "Backend Development"
    elif "android" in text_lower or "ios" in text_lower or "flutter" in text_lower or "mobile" in text_lower:
        domain = "Mobile Application Development"

    # Identify languages
    langs = []
    for lang in ["python", "javascript", "c++", "java", "golang", "typescript", "rust", "sql", "ruby"]:
        if f" {lang} " in f" {text_lower} " or f" {lang}," in f" {text_lower} " or f" {lang}\n" in f" {text_lower} ":
            # standard formatting mapping
            name = lang.replace("golang", "Go").replace("c++", "C++").title()
            langs.append(name)
    if not langs:
        langs = ["Python", "JavaScript", "C++"]

    # Identify tech keywords
    techs = []
    keywords = ["fastapi", "react", "pytorch", "postgresql", "docker", "aws", "kubernetes", "chromadb", "sqlite", "node.js", "git", "mongodb", "next.js", "django"]
    for keyword in keywords:
        if keyword in text_lower:
            # map nicely
            mapped = keyword.replace("fastapi", "FastAPI").replace("react", "React").replace("pytorch", "PyTorch").replace("postgresql", "PostgreSQL").replace("docker", "Docker").replace("aws", "AWS").replace("chromadb", "ChromaDB").title()
            techs.append(mapped)
    if not techs:
        techs = ["FastAPI", "React", "PostgreSQL"]

    return {
        "careerDomain": domain,
        "primaryLanguages": langs[:5],
        "techStack": techs[:8]
    }


async def analyze_gap_and_priorities(
    leetcode_topics: List[Dict[str, Any]],
    resume_skills: Dict[str, Any],
    target_companies: List[str]
) -> Dict[str, Any]:
    
    # ─── 1. Calculate Company Priorities (Aggregate Templates) ─────────
    company_priorities = aggregate_company_topic_priorities(target_companies)
    
    # ─── 2. Formulate LeetCode Weakness Quotient (W_LC) ────────────────
    # Formula: W_LC,i = 100 - (Solved,i / Total,i * 100)
    weakness_vector = {}
    for item in leetcode_topics:
        topic = item["topic"]
        solved = item["solved"]
        total = item.get("total", 50)
        pct = (solved / total) * 100.0 if total > 0 else 0.0
        weakness_vector[topic] = max(0.0, 100.0 - pct)

    # ─── 3. Determine Resume Domain Affinity (R_Resume) ────────────────
    # Map topics relevance based on domain
    domain = resume_skills.get("careerDomain", "").lower()
    domain_affinity = {"Arrays": 20.0, "Trees": 20.0, "Graphs": 20.0, "DP": 20.0, "Strings": 20.0}
    
    if "ml" in domain or "ai" in domain or "machine learning" in domain:
        domain_affinity = {"Arrays": 35.0, "Graphs": 25.0, "DP": 20.0, "Trees": 10.0, "Strings": 10.0}
    elif "backend" in domain or "systems" in domain:
        domain_affinity = {"Arrays": 30.0, "Graphs": 30.0, "Trees": 20.0, "Strings": 10.0, "DP": 10.0}
    elif "frontend" in domain or "ui" in domain:
        domain_affinity = {"Arrays": 30.0, "Strings": 30.0, "Trees": 15.0, "DP": 15.0, "Graphs": 10.0}

    # ─── 4. Fused Heuristic Strategy ────────────────────────────────────
    # Mix values using weighting: PRI = 0.40 * W_LC + 0.40 * T_Comp + 0.20 * R_Res
    raw_priorities = {}
    for topic in ["Arrays", "Trees", "Graphs", "DP", "Strings"]:
        w_lc = weakness_vector.get(topic, 50.0)
        t_comp = company_priorities.get(topic, 20.0)
        r_res = domain_affinity.get(topic, 20.0)
        
        # Linear dynamic score calculation
        score = (0.40 * w_lc) + (0.40 * t_comp) + (0.20 * r_res)
        raw_priorities[topic] = score

    # Normalize priorities so they sum to exactly 100%
    total_score = sum(raw_priorities.values())
    normal_priorities = {}
    remainder = 100
    sorted_priorities = sorted(raw_priorities.items(), key=lambda x: x[1], reverse=True)
    
    for idx, (topic, score) in enumerate(sorted_priorities):
        if idx == len(sorted_priorities) - 1:
            normal_priorities[topic] = remainder
        else:
            allocated = int(round((score / total_score) * 100))
            normal_priorities[topic] = allocated
            remainder -= allocated

    # ─── 5. Call Gemini AI to refine assessment rationale if possible ────
    inferred_patterns = ""
    readiness_assessment = ""

    if gemini_model:
        topics_str = "\n".join([f" * {t['topic']}: {t['solved']}/{t['total']}" for t in leetcode_topics])
        targets_str = ", ".join(target_companies)
        skills_str = f"Domain: {resume_skills['careerDomain']}, Stack: {', '.join(resume_skills.get('techStack', []))}"
        
        prompt = f"""
        You are an expert AI Technical Interview Prep Coach.
        Perform a dynamic Placement readiness gap analysis for the candidate.
        
        LeetCode Solved Progress:
        {topics_str}
        
        Extracted Resume Domain:
        {skills_str}
        
        Target Companies Selected:
        {targets_str}
        
        You must generate two outputs in JSON matching this schema:
        {{
          "inferredCompanyPatterns": "Provide a 1-sentence analytical overview of what topics these specific target companies look for and expect.",
          "readinessAssessment": "Provide a 1-sentence diagnostic evaluation outlining the user's primary DSA weaknesses and placement hurdles."
        }}
        """
        try:
            response = gemini_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            parsed = json.loads(response.text.strip())
            inferred_patterns = parsed.get("inferredCompanyPatterns", "")
            readiness_assessment = parsed.get("readinessAssessment", "")
            logger.info("Successfully calculated assessment rationale using Gemini AI")
        except Exception as e:
            logger.error(f"Gemini API error during gap rationale generation: {e}")

    # Fallback qualitative rationale if Gemini API fails/is-disabled
    if not inferred_patterns or not readiness_assessment:
        inferred_patterns = f"Focus on topics preferred by {', '.join(target_companies)}: " + ", ".join(
            [f"{prof['companyName']} prefers {prof['advice'].split('.')[0]}" for prof in [get_company_profile(c) for c in target_companies][:2]]
        ) + "."
        
        weak_topics = [t for t, score in sorted(normal_priorities.items(), key=lambda x: x[1], reverse=True)[:2]]
        readiness_assessment = f"Your profile indicates a solid conceptual foundation, but shows significant gaps in {weak_topics[0]} and {weak_topics[1]} that could block placement success."

    return {
        "inferredCompanyPatterns": inferred_patterns,
        "readinessAssessment": readiness_assessment,
        "dynamicTopicPriorities": normal_priorities
    }
