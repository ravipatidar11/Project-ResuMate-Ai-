from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeBase
from app.services.auth_service import get_current_user
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/pdf", tags=["PDF Generation"])

@router.get("/export/{resume_id}")
def export_resume_pdf(
    resume_id: int,
    template: str = Query("ats_friendly"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download an ATS-friendly, professional PDF for a saved resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_dict = {
        "title": resume.title,
        "template_name": template or resume.template_name or "ats_friendly",
        "target_role": resume.target_role,
        "personal_info": resume.personal_info or {},
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

    try:
        pdf_bytes = PDFService.generate_resume_pdf(resume_dict, template_name=template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

    clean_filename = f"{resume.title.replace(' ', '_').lower()}_{template}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={clean_filename}"}
    )

@router.post("/export-custom")
def export_custom_resume_pdf(
    resume_data: ResumeBase,
    template: str = Query("ats_friendly"),
    current_user: User = Depends(get_current_user)
):
    """Download an ATS-friendly PDF directly from current builder draft without requiring a database save first."""
    data = resume_data.model_dump()
    try:
        pdf_bytes = PDFService.generate_resume_pdf(data, template_name=template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

    name = data.get("personal_info", {}).get("fullName") or "Resume"
    clean_filename = f"{name.replace(' ', '_').lower()}_{template}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={clean_filename}"}
    )
