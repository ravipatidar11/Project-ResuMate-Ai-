from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class JobMatchRequest(BaseModel):
    resume_id: Optional[int] = None
    resume_text: Optional[str] = None
    job_title: str = ""
    job_company: Optional[str] = ""
    job_description: str

class JobMatchResponse(BaseModel):
    id: Optional[int] = None
    resume_id: Optional[int] = None
    job_title: str
    job_company: str
    match_percentage: int
    matching_skills: List[str]
    missing_skills: List[str]
    keywords: List[Dict[str, Any]]
    experience_match: Dict[str, Any]
    recommendations: List[str]
    optimized_suggestions: List[Dict[str, str]]
    ai_report: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OptimizeResumeRequest(BaseModel):
    resume_id: Optional[int] = None
    job_description: str
    current_resume_data: Optional[Dict[str, Any]] = None

class OptimizeResumeResponse(BaseModel):
    suggested_summary: str
    suggested_bullet_points: List[str]
    critical_skills_to_add: List[str]
    keywords_to_embed: List[str]
    tailored_headline: str
