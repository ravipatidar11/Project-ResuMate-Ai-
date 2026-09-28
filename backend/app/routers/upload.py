import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.services.auth_service import get_current_user
from app.services.parser_service import ParserService
from app.services.ai_analyzer import AIAnalyzer

router = APIRouter(prefix="/upload", tags=["Upload & Parse"])

@router.post("/import")
async def import_resume_for_editing(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Keep the uploaded original and create an editable, versioned resume record."""
    filename = os.path.basename((file.filename or "resume").replace("\\", "/"))
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX resumes can be imported.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File must be smaller than {settings.MAX_UPLOAD_SIZE_MB} MB.")

    stored_name = f"{uuid.uuid4().hex}_{filename}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    try:
        with open(stored_path, "wb") as stored_file:
            stored_file.write(contents)
        raw_text = ParserService.parse_file(stored_path)
        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="This file has no extractable text. Try a text-based PDF or DOCX.")
        data = ParserService.extract_structured_data(raw_text)
        resume = Resume(
            user_id=current_user.id,
            title=f"{data['personal_info'].get('fullName') or os.path.splitext(filename)[0]} - Editable Resume"[:80],
            template_name="ats_friendly",
            target_role=data["personal_info"].get("jobTitle", ""),
            personal_info=data["personal_info"],
            summary=data["summary"],
            education=data["education"],
            experience=data["experience"],
            internships=data["internships"],
            projects=data["projects"],
            skills=data["skills"],
            certifications=data["certifications"],
            achievements=data["achievements"],
            languages=data["languages"],
            interests=data["interests"],
            section_order=["summary", "experience", "internships", "projects", "education", "skills", "certifications", "achievements", "languages"],
            version_number=1,
            source_filename=filename,
            source_file_path=stored_path,
        )
        db.add(resume)
        db.flush()
        resume.version_group_id = resume.id
        db.commit()
        db.refresh(resume)
        return {"success": True, "resume_id": resume.id, "title": resume.title, "source_filename": filename, "version_number": resume.version_number}
    except HTTPException:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise
    except Exception as exc:
        db.rollback()
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise HTTPException(status_code=422, detail=f"Could not import resume: {exc}") from exc

@router.post("/parse")
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    auto_create_resume: bool = Form(True),
    target_role: str = Form(""),
    job_description: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a PDF or DOCX file, parse text, extract structured data, perform ATS analysis, and optionally save as a resume."""
    filename = file.filename or "resume"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only .pdf and .docx files are permitted."
        )

    # Save to local storage
    file_id = f"{uuid.uuid4().hex[:12]}_{filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, file_id)

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text
    try:
        raw_text = ParserService.parse_file(saved_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document text: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="The uploaded document contains no readable text.")

    # Extract structured fields
    structured_data = ParserService.extract_structured_data(raw_text)
    if target_role:
        structured_data["personal_info"]["jobTitle"] = target_role

    # Main scoring and reasoning come from the configured local Ollama model.
    ai_report = await AIAnalyzer.analyze_resume(
        raw_text,
        target_role=target_role or structured_data.get("personal_info", {}).get("jobTitle", ""),
        job_description=job_description,
        resume_data=structured_data,
    )
    analysis_data = AIAnalyzer.legacy_analysis_fields(ai_report)

    # If auto_create_resume, save into resumes table
    created_resume_id = None
    if auto_create_resume:
        resume_title = f"{structured_data.get('personal_info', {}).get('fullName', 'Candidate')} - {os.path.splitext(filename)[0]}"
        new_resume = Resume(
            user_id=current_user.id,
            title=resume_title[:80],
            template_name="ats_friendly",
            target_role=target_role or structured_data.get("personal_info", {}).get("jobTitle", ""),
            personal_info=structured_data.get("personal_info", {}),
            summary=structured_data.get("summary", ""),
            education=structured_data.get("education", []),
            experience=structured_data.get("experience", []),
            internships=structured_data.get("internships", []),
            projects=structured_data.get("projects", []),
            skills=structured_data.get("skills", {}),
            certifications=structured_data.get("certifications", []),
            achievements=structured_data.get("achievements", []),
            languages=structured_data.get("languages", []),
            interests=structured_data.get("interests", [])
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        created_resume_id = new_resume.id

    # Save analysis record to history
    analysis_record = ResumeAnalysis(
        user_id=current_user.id,
        resume_id=created_resume_id,
        file_name=filename,
        overall_score=analysis_data["overall_score"],
        ats_compatibility=analysis_data["ats_compatibility"],
        section_scores=analysis_data["section_scores"],
        detected_skills=analysis_data["detected_skills"],
        missing_skills=analysis_data["missing_skills"],
        keywords=analysis_data["keywords"],
        formatting_issues=analysis_data["formatting_issues"],
        missing_information=analysis_data["missing_information"],
        suggestions=analysis_data["suggestions"],
        ai_report=analysis_data["ai_report"],
        raw_text=raw_text[:10000]
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return {
        "success": True,
        "filename": filename,
        "resume_id": created_resume_id,
        "analysis_id": analysis_record.id,
        "parsed_data": structured_data,
        "analysis": analysis_data,
        "raw_text_preview": raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    }
