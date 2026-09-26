from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # 1. Manual Human Evaluation (Interviewer)
    manual_score = Column(Float, nullable=True)
    manual_rubric_scores = Column(JSON, default=list)  # [{"criterion": "Technical", "score": 8, "comment": ""}]
    manual_notes = Column(Text, nullable=True)

    # 2. Audio & AI Evaluation
    audio_file_url = Column(String(500), nullable=True)
    candidate_audio_consent = Column(String(10), default="yes")  # "yes" | "no"
    transcript = Column(JSON, default=list)  # List of segments with speaker & timestamp
    
    ai_rating = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_rubric_scores = Column(JSON, default=list)
    ai_strengths = Column(JSON, default=list)
    ai_weaknesses = Column(JSON, default=list)
    ai_recommendation = Column(String(100), nullable=True)  # Pass / Hold / Reject

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    interview = relationship("Interview", back_populates="evaluation")
