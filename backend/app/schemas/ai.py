from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class GenerateSummaryRequest(BaseModel):
    role: str = ""
    experience_level: str = "Mid-level"  # Entry-level, Mid-level, Senior, Executive
    key_skills: List[str] = Field(default_factory=list)
    recent_experience: Optional[str] = ""

class ImproveSummaryRequest(BaseModel):
    summary: str
    target_role: Optional[str] = ""

class ImproveExperienceRequest(BaseModel):
    role: str = ""
    company: str = ""
    bullets: List[str] = Field(default_factory=list)

class GenerateProjectDescRequest(BaseModel):
    title: str
    technologies: List[str] = Field(default_factory=list)
    overview: Optional[str] = ""

class GenerateBulletsRequest(BaseModel):
    role: str
    industry: Optional[str] = "Tech"
    keywords: List[str] = Field(default_factory=list)
    count: int = 4

class ImproveSkillsRequest(BaseModel):
    current_skills: Union[List[str], Dict[str, Any]] = Field(default_factory=list)
    target_role: str = ""

class MakeAtsFriendlyRequest(BaseModel):
    text: Optional[str] = ""
    resume_data: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    success: bool = True
    result: Any
    suggestions: List[str] = Field(default_factory=list)
    model_used: str = "Built-in Resume Analysis Rules"
    message: Optional[str] = None

class AnalysisEngineStatus(BaseModel):
    available: bool
    engine: str
    message: str
