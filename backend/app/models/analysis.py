import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    file_name = Column(String, default="")
    overall_score = Column(Integer, default=0)  # 0 to 100
    ats_compatibility = Column(String, default="Moderate")  # Excellent, Good, Moderate, Needs Improvement
    
    # Detailed section scores and metrics
    section_scores = Column(JSON, default=dict)  # { contact: 90, summary: 75, experience: 80, education: 85, skills: 70 }
    detected_skills = Column(JSON, default=list)  # ["Python", "FastAPI", "React", ...]
    missing_skills = Column(JSON, default=list)
    keywords = Column(JSON, default=list)  # [{ word: "CI/CD", count: 2, status: "Present" }]
    formatting_issues = Column(JSON, default=list)  # ["Avoid tables/columns in standard ATS", ...]
    missing_information = Column(JSON, default=list)  # ["No LinkedIn link provided", "Missing quantifiable metrics"]
    suggestions = Column(JSON, default=list)  # Step by step actionable recommendations
    ai_report = Column(JSON, default=dict)
    raw_text = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
