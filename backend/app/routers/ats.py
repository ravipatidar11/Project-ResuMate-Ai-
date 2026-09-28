from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import ResumeAnalysis
from app.models.resume import Resume
from app.models.user import User
from app.schemas.analysis import AnalyzeTextRequest, AnalysisListItem, AnalysisResponse
from app.services.ai_analyzer import AIAnalyzer
from app.services.auth_service import get_current_user
from app.services.parser_service import ParserService

router = APIRouter(prefix="/ats", tags=["ATS Analysis"])


def _save_analysis(db: Session, user_id: int, resume_id, file_name: str, raw_text: str, result: dict):
    record = ResumeAnalysis(
        user_id=user_id,
        resume_id=resume_id,
        file_name=file_name,
        overall_score=result["overall_score"],
        ats_compatibility=result["ats_compatibility"],
        section_scores=result["section_scores"],
        detected_skills=result["detected_skills"],
        missing_skills=result["missing_skills"],
        keywords=result["keywords"],
        formatting_issues=result["formatting_issues"],
        missing_information=result["missing_information"],
        suggestions=result["suggestions"],
        ai_report=result["ai_report"],
        raw_text=(raw_text or "")[:24000],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    result.update({"id": record.id, "file_name": record.file_name, "resume_id": resume_id, "created_at": record.created_at})
    return result


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_raw_text(
    req: AnalyzeTextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze pasted resume content with the configured local Ollama model."""
    structured_data = ParserService.extract_structured_data(req.text)
    if req.target_role:
        structured_data.setdefault("personal_info", {})["jobTitle"] = req.target_role
    report = await AIAnalyzer.analyze_resume(
        req.text,
        target_role=req.target_role or "",
        job_description=req.job_description or "",
        resume_data=structured_data,
    )
    result = AIAnalyzer.legacy_analysis_fields(report)
    return _save_analysis(db, current_user.id, req.resume_id, "Pasted Resume Text", req.text, result)


@router.post("/analyze-resume/{resume_id}", response_model=AnalysisResponse)
async def analyze_saved_resume(
    resume_id: int,
    job_description: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run local-model analysis on a saved resume, optionally against a job description."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_dict = {
        "title": resume.title,
        "target_role": resume.target_role or "",
        "personal_info": resume.personal_info or {},
        "summary": resume.summary or "",
        "education": resume.education or [],
        "experience": resume.experience or [],
        "internships": resume.internships or [],
        "projects": resume.projects or [],
        "skills": resume.skills or {},
        "certifications": resume.certifications or [],
        "achievements": resume.achievements or [],
        "languages": resume.languages or [],
        "interests": resume.interests or [],
    }
    report = await AIAnalyzer.analyze_resume(
        "",
        target_role=resume.target_role or "",
        job_description=job_description,
        resume_data=resume_dict,
    )
    result = AIAnalyzer.legacy_analysis_fields(report)
    return _save_analysis(db, current_user.id, resume.id, resume.title, "", result)


@router.get("/history", response_model=List[AnalysisListItem])
def get_analysis_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).all()


@router.get("/history/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_detail(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id, ResumeAnalysis.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    return record


@router.delete("/history/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id, ResumeAnalysis.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    db.delete(record)
    db.commit()
    return {"message": "Analysis report deleted successfully"}
