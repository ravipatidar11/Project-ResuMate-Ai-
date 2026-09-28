from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AnalyzeTextRequest(BaseModel):
    text: str
    resume_id: Optional[int] = None
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""

class AnalysisResponse(BaseModel):
    id: Optional[int] = None
    resume_id: Optional[int] = None
    file_name: Optional[str] = ""
    overall_score: int
    ats_compatibility: str
    section_scores: Dict[str, int]
    detected_skills: List[str]
    missing_skills: List[str]
    keywords: List[Dict[str, Any]]
    formatting_issues: List[str]
    missing_information: List[str]
    suggestions: List[str]
    ai_report: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnalysisListItem(BaseModel):
    id: int
    resume_id: Optional[int] = None
    file_name: str
    overall_score: int
    ats_compatibility: str
    created_at: datetime

    class Config:
        from_attributes = True
