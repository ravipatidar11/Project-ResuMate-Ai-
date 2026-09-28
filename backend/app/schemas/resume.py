from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class PersonalInfo(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    jobTitle: str = ""
    website: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""

class EducationItem(BaseModel):
    id: Optional[str] = None
    institution: str = ""
    degree: str = ""
    fieldOfStudy: str = ""
    startDate: str = ""
    endDate: str = ""
    gpa: str = ""
    description: str = ""

class ExperienceItem(BaseModel):
    id: Optional[str] = None
    company: str = ""
    role: str = ""
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    current: bool = False
    bullets: List[str] = Field(default_factory=list)

class InternshipItem(BaseModel):
    id: Optional[str] = None
    company: str = ""
    role: str = ""
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    bullets: List[str] = Field(default_factory=list)

class ProjectItem(BaseModel):
    id: Optional[str] = None
    title: str = ""
    subtitle: str = ""
    link: str = ""
    github: str = ""
    technologies: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)

class CertificationItem(BaseModel):
    id: Optional[str] = None
    name: str = ""
    issuer: str = ""
    issueDate: str = ""
    credentialUrl: str = ""

class AchievementItem(BaseModel):
    id: Optional[str] = None
    title: str = ""
    description: str = ""
    date: str = ""

class LanguageItem(BaseModel):
    id: Optional[str] = None
    language: str = ""
    proficiency: str = "Fluent"  # Native, Fluent, Intermediate, Basic

class ResumeBase(BaseModel):
    title: str = "My Resume"
    template_name: str = "ats_friendly"
    target_role: Optional[str] = ""
    personal_info: Optional[Dict[str, Any]] = Field(default_factory=dict)
    summary: Optional[str] = ""
    education: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    experience: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    internships: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    projects: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    skills: Optional[Union[Dict[str, Any], List[Any]]] = Field(default_factory=dict)
    certifications: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    achievements: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    languages: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    interests: Optional[List[str]] = Field(default_factory=list)
    section_order: Optional[List[str]] = Field(default_factory=lambda: ["summary", "experience", "internships", "projects", "education", "skills", "certifications", "achievements", "languages"])

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(ResumeBase):
    pass

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    version_group_id: Optional[int] = None
    version_number: int = 1
    source_filename: Optional[str] = None

    class Config:
        from_attributes = True

class ResumeListItem(BaseModel):
    id: int
    title: str
    template_name: str
    target_role: str
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
