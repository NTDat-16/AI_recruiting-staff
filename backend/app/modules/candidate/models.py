from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    
    cv_file_url = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    
    # Structured parsed data: education, experience, skills, certifications
    parsed_data = Column(JSON, default=dict)
    
    # Talent search embedding vector
    embedding = Column(JSON, nullable=True)
    
    source = Column(String(100), default="direct_apply")  # direct_apply, referral, hr_upload, linkedin
    tags = Column(JSON, default=list)  # list of string tags
    hr_notes = Column(Text, nullable=True)
    rating = Column(Float, default=0.0)  # manual 1-5 star rating
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    applications = relationship(
        "Application",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="desc(Application.created_at)",
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_posting_id = Column(String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Match score & breakdown from AI
    match_score = Column(Float, nullable=True)
    score_breakdown = Column(JSON, nullable=True)  # breakdown, strengths, gaps, recommendation
    
    # Pipeline status:
    # new -> reviewing -> interview_invited -> interviewed -> offered -> hired | rejected | talent_pool
    status = Column(String(50), default="new", index=True)
    
    # Human-in-the-loop: HR feedback on AI scoring accuracy
    hr_feedback = Column(JSON, nullable=True)  # {"accuracy_rating": 4, "note": "..."}
    hr_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    job_posting = relationship("JobPosting", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")

    @property
    def job_title(self) -> Optional[str]:
        if "job_posting" in self.__dict__ and self.job_posting:
            return getattr(self.job_posting, "title", None)
        return None
