from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    salary_range = Column(String(100), nullable=True)
    
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    
    # AI criteria weights config (JSON: {"required_skills": 0.4, "experience_years": 0.3, "education": 0.15, "nice_to_have": 0.15})
    ai_criteria_weights = Column(JSON, default=dict)
    
    # Status: draft -> pending_approval -> published -> paused -> closed
    status = Column(String(50), default="draft", index=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    
    view_count = Column(String(50), default="0")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="job_postings")
    applications = relationship("Application", back_populates="job_posting", cascade="all, delete-orphan")
