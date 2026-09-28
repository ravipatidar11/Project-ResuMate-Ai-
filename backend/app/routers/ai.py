from fastapi import APIRouter, Depends
from app.schemas.ai import (
    GenerateSummaryRequest, ImproveSummaryRequest, ImproveExperienceRequest,
    GenerateProjectDescRequest, GenerateBulletsRequest, ImproveSkillsRequest,
    MakeAtsFriendlyRequest, AIResponse, OllamaStatusResponse
)
from app.services.ai_service import AIService
from app.services.ai_analyzer import AIAnalyzer
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine (Ollama & Free NLP)"])

@router.get("/status", response_model=OllamaStatusResponse)
async def check_ollama_status():
    """Check connectivity to free local Ollama LLM service."""
    status_info = await AIService.check_ollama_status()
    return status_info

@router.post("/generate-summary", response_model=AIResponse)
async def generate_summary(
    req: GenerateSummaryRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate high-impact professional summary for a target role."""
    data = await AIService.generate_summary(
        role=req.role,
        experience_level=req.experience_level,
        key_skills=req.key_skills,
        recent_experience=req.recent_experience
    )
    return data

@router.post("/improve-summary", response_model=AIResponse)
async def improve_summary(
    req: ImproveSummaryRequest,
    current_user: User = Depends(get_current_user)
):
    """Improve existing summary tone, conciseness, and ATS power."""
    data = await AIService.improve_summary(
        current_summary=req.summary,
        target_role=req.target_role
    )
    return data

@router.post("/improve-experience", response_model=AIResponse)
async def improve_experience(
    req: ImproveExperienceRequest,
    current_user: User = Depends(get_current_user)
):
    """Upgrade experience bullet points to XYZ metric-driven formula."""
    data = await AIService.improve_experience(
        role=req.role,
        company=req.company,
        bullets=req.bullets
    )
    return data

@router.post("/generate-project-desc", response_model=AIResponse)
async def generate_project_desc(
    req: GenerateProjectDescRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate project bullet points highlighting architecture and impact."""
    data = await AIService.generate_project_description(
        title=req.title,
        technologies=req.technologies,
        overview=req.overview
    )
    return data

@router.post("/generate-bullets", response_model=AIResponse)
async def generate_bullets(
    req: GenerateBulletsRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate job-specific bullet points on demand."""
    data = await AIService.generate_bullets(
        role=req.role,
        industry=req.industry or "Tech",
        keywords=req.keywords,
        count=req.count
    )
    return data

@router.post("/improve-skills", response_model=AIResponse)
async def improve_skills(
    req: ImproveSkillsRequest,
    current_user: User = Depends(get_current_user)
):
    """Suggest high-value skills matching candidate's target role."""
    data = await AIAnalyzer.suggest_skills(
        current_skills=req.current_skills,
        target_role=req.target_role
    )
    return data

@router.post("/make-ats-friendly", response_model=AIResponse)
async def make_ats_friendly(
    req: MakeAtsFriendlyRequest,
    current_user: User = Depends(get_current_user)
):
    """Audit and optimize resume content for ATS parser standards."""
    report = await AIAnalyzer.analyze_resume(
        req.text or "",
        target_role=(req.resume_data or {}).get("target_role", ""),
        resume_data=req.resume_data,
    )
    ats = report.get("ats_details", {})
    return {
        "success": True,
        "result": {
            "compliance_score": report["scores"]["ats"]["score"],
            "standard_headers_verified": not bool(ats.get("issues")),
            "quantifiable_metrics_present": report["scores"]["impact"]["score"] >= 60,
            "suggestions": ats.get("recommended_changes", []),
            "reasons": ats.get("reasons", []),
            "ai_report": report,
        },
        "model_used": f"Ollama ({report['model']})",
        "is_local_llm": True,
    }
