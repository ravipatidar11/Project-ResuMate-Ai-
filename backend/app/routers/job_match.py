from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job_match import JobMatch
from app.schemas.job_match import JobMatchRequest, JobMatchResponse, OptimizeResumeRequest, OptimizeResumeResponse
from app.services.auth_service import get_current_user
from app.services.ai_analyzer import AIAnalyzer

router = APIRouter(prefix="/job-match", tags=["Job Description Matcher"])

@router.post("", response_model=JobMatchResponse)
async def match_job_description(
    req: JobMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare a resume against a target job description and return similarity score, skill gaps, and suggestions."""
    if not req.job_description.strip():
        raise HTTPException(status_code=422, detail="Paste a job description before running the keyword match.")
    resume_dict = {}
    target_role = req.job_title or ""
    if req.resume_id:
        resume = db.query(Resume).filter(Resume.id == req.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            resume_dict = {
                "personal_info": resume.personal_info or {},
                "target_role": resume.target_role or "",
                "summary": resume.summary or "",
                "education": resume.education or [],
                "experience": resume.experience or [],
                "internships": resume.internships or [],
                "projects": resume.projects or [],
                "skills": resume.skills or {},
                "certifications": resume.certifications or [],
                "achievements": resume.achievements or [],
                "languages": resume.languages or []
            }
            target_role = resume.target_role or ""
        else:
            raise HTTPException(status_code=404, detail="Resume not found")

    resume_text = req.resume_text or ""
    if not resume_dict and req.resume_text:
        from app.services.parser_service import ParserService
        resume_dict = ParserService.extract_structured_data(req.resume_text)
        target_role = req.job_title or ""

    if not resume_dict:
        raise HTTPException(status_code=422, detail="Choose a saved resume or provide resume text before matching a job.")

    report = await AIAnalyzer.analyze_resume(
        resume_text,
        target_role=req.job_title or target_role or "",
        job_description=req.job_description,
        resume_data=resume_dict,
    )
    ai_match = report.get("job_match")
    insufficient_requirements = report.get("job_match_status") == "insufficient_requirements"

    overlapping = [str(skill) for skill in (ai_match or {}).get("overlapping_skills", [])]
    missing = [str(skill) for skill in (ai_match or {}).get("missing_skills", [])]
    important = [str(skill) for skill in (ai_match or {}).get("important_skills", [])]
    recommendations = [str(item) for item in (ai_match or {}).get("recommended_changes", [])]
    if insufficient_requirements:
        recommendations = ["Add specific technical or soft-skill requirements to the job description to calculate a keyword estimate."]
    weaknesses = report.get("weaknesses", [])
    results = {
        # The API keeps its existing integer field; the UI uses the saved
        # insufficiency marker to avoid displaying this sentinel as a score.
        "match_percentage": 0 if insufficient_requirements else max(0, min(100, int(ai_match.get("overall_score", 0)))),
        "matching_skills": overlapping,
        "missing_skills": missing,
        "keywords": [
            {"keyword": skill, "found": skill in overlapping, "category": "Job requirement"}
            for skill in dict.fromkeys(important + overlapping + missing)
        ],
        "experience_match": {
            "requiredYears": "Not assessed by keyword rules",
            "candidateYears": "See listed resume dates",
            "assessment": (ai_match or {}).get("explanation", "No recognized requirements were found in the job description."),
            "scores": (ai_match or {}).get("scores", {}),
        },
        "recommendations": recommendations,
        "optimized_suggestions": [
            {"type": item.get("section", "Resume improvement"), "content": item.get("suggested_version", "")}
            for item in weaknesses if isinstance(item, dict) and item.get("suggested_version")
        ],
        "ai_report": report,
    }

    # Save match to database
    record = JobMatch(
        user_id=current_user.id,
        resume_id=req.resume_id,
        job_title=req.job_title or "Target Role",
        job_company=req.job_company or "",
        job_description=req.job_description[:10000],
        match_percentage=results["match_percentage"],
        matching_skills=results["matching_skills"],
        missing_skills=results["missing_skills"],
        keywords=results["keywords"],
        experience_match=results["experience_match"],
        recommendations=results["recommendations"],
        optimized_suggestions=results["optimized_suggestions"],
        ai_report=report,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    results["id"] = record.id
    results["resume_id"] = req.resume_id
    results["job_title"] = record.job_title
    results["job_company"] = record.job_company
    results["created_at"] = record.created_at
    return results

@router.post("/optimize", response_model=OptimizeResumeResponse)
async def optimize_resume(
    req: OptimizeResumeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return fact-preserving keyword-based job suggestions."""
    resume_dict = req.current_resume_data or {}
    if req.resume_id and not resume_dict:
        resume = db.query(Resume).filter(Resume.id == req.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            resume_dict = {
                "personal_info": resume.personal_info or {},
                "target_role": resume.target_role or "",
                "summary": resume.summary or "",
                "education": resume.education or [],
                "experience": resume.experience or [],
                "internships": resume.internships or [],
                "projects": resume.projects or [],
                "skills": resume.skills or {},
                "certifications": resume.certifications or [],
                "achievements": resume.achievements or [],
            }
        else:
            raise HTTPException(status_code=404, detail="Resume not found")
    if not resume_dict:
        raise HTTPException(status_code=422, detail="Choose a resume before generating tailored suggestions.")

    return await AIAnalyzer.tailor_resume(resume_dict, req.job_description)

@router.get("/history", response_model=List[JobMatchResponse])
def get_job_match_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List historical Job Description match results for the authenticated user."""
    return db.query(JobMatch).filter(JobMatch.user_id == current_user.id).order_by(JobMatch.created_at.desc()).all()

@router.delete("/history/{match_id}")
def delete_job_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a past job match record."""
    record = db.query(JobMatch).filter(JobMatch.id == match_id, JobMatch.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Job match record not found")
    db.delete(record)
    db.commit()
    return {"message": "Job match record deleted successfully"}
