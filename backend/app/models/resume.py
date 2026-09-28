import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, default="Untitled Resume")
    template_name = Column(String, default="ats_friendly")  # ats_friendly, modern_professional, minimal_professional
    target_role = Column(String, default="")
    
    # Core Resume Data
    personal_info = Column(JSON, default=dict)  # { fullName, email, phone, location, jobTitle, website, linkedin, github }
    summary = Column(Text, default="")
    education = Column(JSON, default=list)  # [ { id, institution, degree, fieldOfStudy, startDate, endDate, gpa, description } ]
    experience = Column(JSON, default=list)  # [ { id, company, role, location, startDate, endDate, current, bullets: [] } ]
    internships = Column(JSON, default=list) # [ { id, company, role, location, startDate, endDate, bullets: [] } ]
    projects = Column(JSON, default=list)  # [ { id, title, subtitle, link, github, technologies: [], bullets: [] } ]
    skills = Column(JSON, default=dict)  # { technical: [], soft: [], tools: [], languages: [] } or list
    certifications = Column(JSON, default=list)  # [ { id, name, issuer, issueDate, credentialUrl } ]
    achievements = Column(JSON, default=list)  # [ { id, title, description, date } ]
    languages = Column(JSON, default=list)  # [ { id, language, proficiency } ]
    interests = Column(JSON, default=list)
    version_group_id = Column(Integer, nullable=True, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    source_filename = Column(String, nullable=True)
    source_file_path = Column(String, nullable=True)
    section_order = Column(JSON, default=lambda: ["summary", "experience", "internships", "projects", "education", "skills", "certifications", "achievements", "languages"])
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    analyses = relationship("ResumeAnalysis", back_populates="resume", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")
