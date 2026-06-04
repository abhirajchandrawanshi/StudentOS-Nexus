"""
app/resume/config.py
────────────────────
Central configuration for the Resume Analysis module.

Contains:
  - DOMAIN_SKILL_MAP   : required skills per target domain
  - DOMAIN_JD_SNIPPETS : canonical JD text for semantic similarity
  - SCORING_WEIGHTS    : component weights for placement readiness
  - SECTION_HEADERS    : regex patterns for section detection
  - ATS constants
"""

from __future__ import annotations
from typing import Dict, List


# ─── Supported Target Domains ────────────────────────────────────────────────

SUPPORTED_DOMAINS: List[str] = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Data Scientist",
    "DevOps Engineer",
]


# ─── Domain → Required Skill Map ─────────────────────────────────────────────
# Keys are lowercase for case-insensitive matching.

DOMAIN_SKILL_MAP: Dict[str, Dict[str, List[str]]] = {
    "Frontend Developer": {
        "core": [
            "html", "css", "javascript", "typescript", "react", "vue", "angular",
            "next.js", "nuxt", "webpack", "vite", "sass", "tailwindcss",
        ],
        "tools": [
            "git", "figma", "jest", "cypress", "storybook", "npm", "yarn",
            "eslint", "prettier", "browser devtools",
        ],
        "soft_signals": [
            "responsive design", "accessibility", "performance optimisation",
            "web vitals", "seo", "cross-browser", "ui/ux",
        ],
    },
    "Backend Developer": {
        "core": [
            "python", "node.js", "java", "go", "rust", "fastapi", "django",
            "express", "spring boot", "rest api", "graphql", "grpc",
            "postgresql", "mysql", "mongodb", "redis", "kafka",
        ],
        "tools": [
            "docker", "git", "postman", "swagger", "nginx", "celery",
            "rabbitmq", "elasticsearch", "linux", "bash",
        ],
        "soft_signals": [
            "microservices", "scalability", "caching", "rate limiting",
            "authentication", "authorisation", "jwt", "oauth",
            "database optimisation", "api design",
        ],
    },
    "Full Stack Developer": {
        "core": [
            "html", "css", "javascript", "typescript", "react", "node.js",
            "python", "fastapi", "django", "express", "postgresql", "mongodb",
            "rest api", "graphql",
        ],
        "tools": [
            "docker", "git", "webpack", "vite", "nginx", "redis",
            "jest", "cypress", "figma",
        ],
        "soft_signals": [
            "full stack", "end-to-end", "responsive design", "microservices",
            "ci/cd", "deployment", "cloud", "agile",
        ],
    },
    "AI/ML Engineer": {
        "core": [
            "python", "pytorch", "tensorflow", "keras", "scikit-learn",
            "numpy", "pandas", "opencv", "huggingface", "transformers",
            "llm", "rag", "fine-tuning", "nlp", "computer vision",
            "reinforcement learning", "mlops",
        ],
        "tools": [
            "jupyter", "git", "docker", "mlflow", "wandb", "dvc",
            "fastapi", "streamlit", "cuda", "aws sagemaker", "gcp vertex ai",
        ],
        "soft_signals": [
            "model deployment", "model evaluation", "experiment tracking",
            "data preprocessing", "feature engineering", "hyperparameter tuning",
            "neural networks", "deep learning", "inference optimisation",
        ],
    },
    "Data Scientist": {
        "core": [
            "python", "r", "sql", "pandas", "numpy", "scikit-learn",
            "matplotlib", "seaborn", "plotly", "statistics", "hypothesis testing",
            "regression", "classification", "clustering", "time series",
        ],
        "tools": [
            "jupyter", "tableau", "power bi", "excel", "git", "spark",
            "hadoop", "airflow", "dbt", "snowflake", "bigquery",
        ],
        "soft_signals": [
            "data analysis", "eda", "storytelling", "a/b testing",
            "business intelligence", "kpi", "dashboard", "data pipeline",
            "statistical modelling", "predictive analytics",
        ],
    },
    "DevOps Engineer": {
        "core": [
            "linux", "bash", "python", "docker", "kubernetes", "helm",
            "terraform", "ansible", "jenkins", "github actions", "gitlab ci",
            "aws", "azure", "gcp", "prometheus", "grafana", "elk stack",
        ],
        "tools": [
            "git", "nginx", "vault", "consul", "istio", "argocd",
            "datadog", "pagerduty", "sonarqube",
        ],
        "soft_signals": [
            "ci/cd", "infrastructure as code", "site reliability",
            "incident management", "on-call", "sla/slo/sli",
            "container orchestration", "cloud architecture", "security hardening",
        ],
    },
}


# ─── Canonical Job Description Snippets (for semantic scoring) ────────────────
# These are dense keyword-rich JD snippets used to embed a "domain reference vector".

DOMAIN_JD_SNIPPETS: Dict[str, str] = {
    "Frontend Developer": (
        "We are looking for a skilled Frontend Developer proficient in HTML, CSS, "
        "JavaScript, TypeScript, and React or Vue. You will build responsive, accessible, "
        "and performant web interfaces, collaborate with designers using Figma, write unit "
        "tests with Jest and Cypress, optimise Web Vitals, and follow best practices in "
        "cross-browser compatibility and SEO."
    ),
    "Backend Developer": (
        "Seeking a Backend Developer experienced in Python, Node.js or Go to design and "
        "build scalable REST APIs and microservices. Strong knowledge of PostgreSQL, Redis, "
        "Kafka, Docker, and Linux. Experience with authentication (JWT, OAuth), rate limiting, "
        "caching strategies, and API design. Familiarity with FastAPI, Django, or Express."
    ),
    "Full Stack Developer": (
        "Looking for a Full Stack Developer capable of building end-to-end web applications. "
        "Proficient in React or Next.js for the frontend and Node.js, Python (FastAPI/Django) "
        "for the backend. Experience with PostgreSQL, MongoDB, REST APIs, GraphQL, Docker, "
        "CI/CD pipelines, and cloud deployment. Strong understanding of both UI/UX and "
        "system architecture."
    ),
    "AI/ML Engineer": (
        "We need an AI/ML Engineer with strong Python skills and experience in PyTorch or "
        "TensorFlow. You will design and train deep learning models, work with LLMs and "
        "transformer architectures, build RAG systems, fine-tune pre-trained models, and "
        "deploy ML pipelines using MLflow, Docker, and cloud platforms. Expertise in NLP "
        "and computer vision is a plus."
    ),
    "Data Scientist": (
        "Hiring a Data Scientist skilled in Python, R, and SQL for statistical modelling, "
        "EDA, A/B testing, and building predictive analytics pipelines. Experience with "
        "scikit-learn, Pandas, Matplotlib, Tableau, and cloud data warehouses (Snowflake, "
        "BigQuery). Strong communication skills for data storytelling and stakeholder-facing dashboards."
    ),
    "DevOps Engineer": (
        "Seeking a DevOps/SRE Engineer experienced with Linux, Docker, Kubernetes, Terraform, "
        "and Ansible. Responsible for CI/CD pipelines (GitHub Actions, Jenkins), infrastructure "
        "as code, cloud platforms (AWS/GCP/Azure), monitoring (Prometheus, Grafana, ELK), and "
        "incident response. Knowledge of security hardening, SLA/SLO management, and GitOps."
    ),
}


# ─── Placement Readiness Scoring Weights ─────────────────────────────────────

SCORING_WEIGHTS: Dict[str, float] = {
    "ats_score":              0.30,
    "domain_match_pct":       0.25,
    "semantic_match_score":   0.20,
    "project_relevance_avg":  0.15,
    "gemini_holistic_score":  0.10,
}


# ─── ATS Sub-Scoring Weights ─────────────────────────────────────────────────

ATS_WEIGHTS: Dict[str, float] = {
    "keyword_score":       0.30,
    "format_score":        0.25,
    "length_score":        0.20,
    "section_completeness": 0.15,
    "action_verbs_score":  0.10,
}


# ─── Section Header Patterns (regex, case-insensitive) ───────────────────────

SECTION_PATTERNS: Dict[str, List[str]] = {
    "summary": [
        r"\bsummary\b", r"\bprofile\b", r"\bobjective\b",
        r"\babout\s*me\b", r"\bcareer\s*summary\b",
    ],
    "skills": [
        r"\bskills?\b", r"\btechnical\s*skills?\b", r"\bcore\s*competencies\b",
        r"\bprogramming\s*languages?\b", r"\btech(nologies)?\s*stack\b",
    ],
    "experience": [
        r"\bexperience\b", r"\bwork\s*experience\b", r"\bprofessional\s*experience\b",
        r"\binternship(s)?\b", r"\bemployment\b",
    ],
    "education": [
        r"\beducation\b", r"\bacademic(s)?\b", r"\bqualification(s)?\b",
        r"\bdegree(s)?\b", r"\buniversity\b", r"\bcollege\b",
    ],
    "projects": [
        r"\bprojects?\b", r"\bpersonal\s*projects?\b", r"\bacademic\s*projects?\b",
        r"\bside\s*projects?\b", r"\bportfolio\b",
    ],
    "certifications": [
        r"\bcertification(s)?\b", r"\bcertificate(s)?\b", r"\bcourses?\b",
        r"\bawards?\b", r"\bachievements?\b", r"\bhonors?\b",
    ],
}


# ─── ATS Action Verbs ─────────────────────────────────────────────────────────

ACTION_VERBS: List[str] = [
    "built", "designed", "developed", "implemented", "led", "managed",
    "architected", "optimised", "optimized", "deployed", "automated",
    "reduced", "increased", "improved", "created", "delivered", "launched",
    "collaborated", "mentored", "resolved", "integrated", "migrated",
    "refactored", "analysed", "analyzed", "engineered", "orchestrated",
    "streamlined", "accelerated", "established", "maintained", "spearheaded",
]


# ─── Upload Constraints ───────────────────────────────────────────────────────

MAX_FILE_SIZE_MB: int = 5
ALLOWED_MIME_TYPES: List[str] = ["application/pdf"]
RESUME_UPLOAD_DIR: str = "app/uploads/resumes"

# Ideal resume word count range for ATS length scoring
IDEAL_WORD_COUNT_MIN: int = 350
IDEAL_WORD_COUNT_MAX: int = 900
