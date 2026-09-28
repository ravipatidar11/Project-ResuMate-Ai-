import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    job_title = Column(String, default="")
    job_company = Column(String, default="")
    job_description = Column(Text, nullable=False)

    match_percentage = Column(Integer, default=0)  # 0 to 100
    matching_skills = Column(JSON, default=list)  # ["Python", "Docker"]
    missing_skills = Column(JSON, default=list)  # ["Kubernetes", "GraphQL"]
    keywords = Column(JSON, default=list)  # [{ keyword: "Agile", found: True }, ...]
    experience_match = Column(JSON, default=dict)  # { requiredYears: "3-5", candidateYears: "4", assessment: "Aligned" }
    recommendations = Column(JSON, default=list)  # Specific guidance
    optimized_suggestions = Column(JSON, default=list)  # Bullet-by-bullet rewrites / inclusions
    ai_report = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_matches")
    resume = relationship("Resume", back_populates="job_matches")
