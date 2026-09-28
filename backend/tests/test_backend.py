import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.services.pdf_service import PDFService
from app.services.ats_engine import ATSEngine
from app.services.job_matcher import JobMatcher
from app.services.ai_analyzer import AIAnalyzer
from app.services.parser_service import ParserService

# Test database setup with StaticPool so in-memory SQLite tables are preserved across threads
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_registration_and_login():
    # Register
    reg_res = client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "Password123!",
        "full_name": "Test Candidate"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testuser@example.com"

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # Current user
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testuser@example.com"

def test_demo_login():
    demo_res = client.post("/api/auth/demo")
    assert demo_res.status_code == 200
    assert "access_token" in demo_res.json()
    token = demo_res.json()["access_token"]

    # Verify demo resume was seeded
    resumes_res = client.get("/api/resumes", headers={"Authorization": f"Bearer {token}"})
    assert resumes_res.status_code == 200
    resumes = resumes_res.json()
    assert len(resumes) >= 1
    assert "Alex Rivera" in resumes[0]["title"] or resumes[0]["personal_info"]["fullName"] == "Alex Rivera"

def test_resume_crud():
    # Login demo
    token = client.post("/api/auth/demo").json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Resume
    create_res = client.post("/api/resumes", headers=headers, json={
        "title": "Software Developer Resume",
        "template_name": "modern_professional",
        "target_role": "Backend Engineer",
        "personal_info": {"fullName": "Jane Doe", "email": "jane@example.com", "phone": "123-456-7890"},
        "summary": "Experienced engineer with a focus on scalable systems.",
        "skills": {"technical": ["Python", "FastAPI", "Docker"]},
        "experience": [{
            "company": "Acme Corp",
            "role": "Software Engineer",
            "bullets": ["Spearheaded microservices deployment reducing latency by 30%."]
        }]
    })
    assert create_res.status_code == 200
    created = create_res.json()
    resume_id = created["id"]
    assert created["title"] == "Software Developer Resume"

    # Get Resume
    get_res = client.get(f"/api/resumes/{resume_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["target_role"] == "Backend Engineer"

    # Duplicate Resume
    dup_res = client.post(f"/api/resumes/{resume_id}/duplicate", headers=headers)
    assert dup_res.status_code == 200
    assert "(Copy)" in dup_res.json()["title"]

    # Delete original
    del_res = client.delete(f"/api/resumes/{resume_id}", headers=headers)
    assert del_res.status_code == 200

def test_ats_scoring_engine():
    sample_resume = {
        "personal_info": {
            "fullName": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "555-0199",
            "location": "New York, NY",
            "linkedin": "https://linkedin.com/in/janedoe",
            "github": "https://github.com/janedoe"
        },
        "summary": "Proven Software Engineer with 5+ years of experience building reliable backend systems.",
        "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "React", "Git", "REST APIs", "CI/CD"],
        "experience": [
            {
                "company": "Tech Innovations",
                "role": "Senior Engineer",
                "bullets": [
                    "Engineered distributed REST APIs processing 100k daily transactions.",
                    "Optimized database indices resulting in 40% reduction in query execution times."
                ]
            }
        ],
        "education": [
            {
                "institution": "NYU",
                "degree": "B.S. in Computer Science"
            }
        ]
    }
    analysis = ATSEngine.analyze_resume_data(sample_resume)
    assert "overall_score" in analysis
    assert analysis["overall_score"] > 60
    assert "ats_compatibility" in analysis
    assert "section_scores" in analysis
    assert "detected_skills" in analysis
    assert "Python" in analysis["detected_skills"]

def test_job_matching():
    sample_resume = {
        "summary": "Full Stack developer experienced in Python, React, and Docker.",
        "skills": {"technical": ["Python", "React", "Docker", "Git", "SQL"]},
        "experience": [
            {"role": "Full Stack Developer", "bullets": ["Built responsive UI using React and backend with Python."]}
        ]
    }
    jd = "We are hiring a Full Stack Developer with strong knowledge of Python, React, Docker, and Kubernetes."
    match_result = JobMatcher.match_resume_with_job(sample_resume, jd, job_title="Full Stack Developer")
    assert match_result["match_percentage"] > 50
    assert "Python" in match_result["matching_skills"]
    assert "Kubernetes" in match_result["missing_skills"]
    assert len(match_result["recommendations"]) > 0

def test_keyword_estimate_uses_only_recognized_job_skills():
    result = JobMatcher.match_resume_with_job(
        {"skills": {"technical": ["Python"]}},
        "We need Python, React, and Kubernetes experience.",
    )
    assert result["match_percentage"] == 33
    assert result["matching_skills"] == ["Python"]
    assert result["missing_skills"] == ["React", "Kubernetes"]

def test_keyword_estimate_reports_insufficient_requirements_without_inventing_score():
    result = JobMatcher.match_resume_with_job({"skills": {"technical": ["Python"]}}, "Work in our location.")
    assert result["match_percentage"] is None
    assert result["matching_skills"] == []
    assert result["missing_skills"] == []
    assert result["optimized_suggestions"] == []

def test_semantic_job_match_accepts_substantive_zero_and_rejects_placeholders():
    substantive_zero = {
        "overall_score": 0,
        "explanation": "No listed requirements are evidenced in the resume.",
        "important_skills": ["Kubernetes"],
        "overlapping_skills": [],
        "missing_skills": ["Kubernetes"],
        "scores": {"technical_skills": {"score": 0, "explanation": "No related technical skills were found."}},
    }
    placeholder = {
        **substantive_zero,
        "explanation": "...",
        "important_skills": ["..."],
        "missing_skills": ["..."],
        "scores": {"technical_skills": {"score": 0, "explanation": "..."}},
    }
    assert AIAnalyzer._is_usable_job_match(substantive_zero)
    assert not AIAnalyzer._is_usable_job_match(placeholder)

def test_uploaded_resume_parser_preserves_content_without_sample_resume_data():
    parsed = ParserService.extract_structured_data("""Jordan Lee
jordan@example.com
PROFESSIONAL SUMMARY
Backend developer building data services.
SKILLS
Python, FastAPI, PostgreSQL
WORK EXPERIENCE
Backend Engineer - Acme
Built internal APIs for reporting.
EDUCATION
Western College
Bachelor of Science, Computer Science
""")

    assert parsed["personal_info"]["fullName"] == "Jordan Lee"
    assert parsed["personal_info"]["email"] == "jordan@example.com"
    assert parsed["summary"] == "Backend developer building data services."
    assert "Python" in parsed["skills"]["technical"]
    assert "FastAPI" in parsed["skills"]["technical"]
    assert "Built internal APIs for reporting." in parsed["experience"][0]["bullets"]
    assert parsed["education"][0]["institution"] == "Western College"
    assert parsed["education"][0]["degree"] == "Bachelor of Science, Computer Science"
    assert parsed["projects"] == []
    assert all(item["company"] != "Infosys Limited" for item in parsed["experience"])

def test_pdf_generation():
    sample_resume = {
        "personal_info": {
            "fullName": "Alex Rivera",
            "email": "alex@example.com",
            "phone": "123-456-7890",
            "location": "San Francisco, CA"
        },
        "summary": "Passionate software engineer building resilient cloud architectures.",
        "skills": {"technical": ["Python", "FastAPI", "React"]},
        "experience": [
            {
                "company": "Nexus Inc",
                "role": "Lead Engineer",
                "bullets": ["Optimized backend latency by 35% across 20 services."]
            }
        ],
        "education": [
            {"institution": "UC Berkeley", "degree": "B.S. in Computer Science"}
        ]
    }
    for template in ["ats_friendly", "modern_professional", "minimal_professional"]:
        pdf_bytes = PDFService.generate_resume_pdf(sample_resume, template_name=template)
        assert len(pdf_bytes) > 500  # valid PDF generated
        assert pdf_bytes.startswith(b"%PDF")
