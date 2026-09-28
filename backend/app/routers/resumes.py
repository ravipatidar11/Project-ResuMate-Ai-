from typing import List
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeUpdate, ResumeResponse, ResumeListItem
from app.services.auth_service import get_current_user
from app.services.parser_service import ParserService

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.get("", response_model=List[ResumeResponse])
def get_user_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all resumes belonging to the authenticated user."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()

@router.post("", response_model=ResumeResponse)
def create_resume(
    resume_in: ResumeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new resume from scratch."""
    new_resume = Resume(
        user_id=current_user.id,
        title=resume_in.title or "New Resume",
        template_name=resume_in.template_name or "ats_friendly",
        target_role=resume_in.target_role or "",
        personal_info=resume_in.personal_info or {},
        summary=resume_in.summary or "",
        education=resume_in.education or [],
        experience=resume_in.experience or [],
        internships=resume_in.internships or [],
        projects=resume_in.projects or [],
        skills=resume_in.skills or {},
        certifications=resume_in.certifications or [],
        achievements=resume_in.achievements or [],
        languages=resume_in.languages or [],
        interests=resume_in.interests or [],
        section_order=resume_in.section_order or [],
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume

@router.get("/{resume_id}/versions", response_model=List[ResumeResponse])
def get_resume_versions(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    group_id = resume.version_group_id or resume.id
    return db.query(Resume).filter(
        Resume.user_id == current_user.id,
        (Resume.version_group_id == group_id) | (Resume.id == group_id),
    ).order_by(Resume.version_number.desc(), Resume.updated_at.desc()).all()

@router.post("/{resume_id}/versions", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume_version(resume_id: int, resume_in: ResumeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Resume not found")
    group_id = current.version_group_id or current.id
    max_version = db.query(Resume.version_number).filter(
        Resume.user_id == current_user.id,
        (Resume.version_group_id == group_id) | (Resume.id == group_id),
    ).order_by(Resume.version_number.desc()).first()
    version = Resume(
        user_id=current_user.id,
        title=resume_in.title or current.title,
        template_name=resume_in.template_name or current.template_name,
        target_role=resume_in.target_role or "",
        personal_info=resume_in.personal_info or {},
        summary=resume_in.summary or "",
        education=resume_in.education or [],
        experience=resume_in.experience or [],
        internships=resume_in.internships or [],
        projects=resume_in.projects or [],
        skills=resume_in.skills or {},
        certifications=resume_in.certifications or [],
        achievements=resume_in.achievements or [],
        languages=resume_in.languages or [],
        interests=resume_in.interests or current.interests or [],
        section_order=resume_in.section_order or current.section_order or [],
        version_group_id=group_id,
        version_number=(max_version[0] if max_version else current.version_number or 1) + 1,
        source_filename=current.source_filename,
        source_file_path=current.source_file_path,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version

@router.get("/{resume_id}/source")
def get_original_resume_file(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume or not resume.source_file_path or not os.path.isfile(resume.source_file_path):
        raise HTTPException(status_code=404, detail="Original uploaded resume file not found")
    return FileResponse(resume.source_file_path, filename=resume.source_filename or "original-resume")

@router.post("/{resume_id}/reimport", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def reimport_original_resume(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a fresh editable version by re-extracting the unchanged source file."""
    original = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not original or not original.source_file_path or not os.path.isfile(original.source_file_path):
        raise HTTPException(status_code=404, detail="Original uploaded resume file not found")
    try:
        source_text = ParserService.parse_file(original.source_file_path)
        data = ParserService.extract_structured_data(source_text)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not re-extract this resume: {exc}") from exc
    group_id = original.version_group_id or original.id
    latest = db.query(Resume.version_number).filter(
        Resume.user_id == current_user.id,
        (Resume.version_group_id == group_id) | (Resume.id == group_id),
    ).order_by(Resume.version_number.desc()).first()
    refreshed = Resume(
        user_id=current_user.id, title=original.title, template_name=original.template_name,
        target_role=data["personal_info"].get("jobTitle", ""),
        personal_info=data["personal_info"], summary=data["summary"],
        education=data["education"], experience=data["experience"], internships=data["internships"],
        projects=data["projects"], skills=data["skills"], certifications=data["certifications"],
        achievements=data["achievements"], languages=data["languages"], interests=data["interests"],
        section_order=original.section_order or [], version_group_id=group_id,
        version_number=(latest[0] if latest else original.version_number or 1) + 1,
        source_filename=original.source_filename, source_file_path=original.source_file_path,
    )
    db.add(refreshed)
    db.commit()
    db.refresh(refreshed)
    return refreshed

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full resume details by ID."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: int,
    resume_in: ResumeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume.title = resume_in.title
    resume.template_name = resume_in.template_name
    resume.target_role = resume_in.target_role
    resume.personal_info = resume_in.personal_info
    resume.summary = resume_in.summary
    resume.education = resume_in.education
    resume.experience = resume_in.experience
    resume.internships = resume_in.internships
    resume.projects = resume_in.projects
    resume.skills = resume_in.skills
    resume.certifications = resume_in.certifications
    resume.achievements = resume_in.achievements
    resume.languages = resume_in.languages
    resume.interests = resume_in.interests or []
    resume.section_order = resume_in.section_order or resume.section_order or []

    db.commit()
    db.refresh(resume)
    return resume

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}

@router.post("/{resume_id}/duplicate", response_model=ResumeResponse)
def duplicate_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Duplicate an existing resume."""
    orig = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Resume not found")

    duplicated = Resume(
        user_id=current_user.id,
        title=f"{orig.title} (Copy)",
        template_name=orig.template_name,
        target_role=orig.target_role,
        personal_info=orig.personal_info,
        summary=orig.summary,
        education=orig.education,
        experience=orig.experience,
        internships=orig.internships,
        projects=orig.projects,
        skills=orig.skills,
        certifications=orig.certifications,
        achievements=orig.achievements,
        languages=orig.languages,
        section_order=orig.section_order,
        interests=orig.interests,
    )
    db.add(duplicated)
    db.commit()
    db.refresh(duplicated)
    return duplicated
