from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from app.core.database import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="SET NULL"), nullable=True, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)

    template_name = Column(String(100), nullable=True)
    email_type = Column(String(50), nullable=False, index=True)  # invitation, rejection, offer, reminder, custom
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    
    # Status: queued -> sent -> opened -> clicked | bounced | failed
    status = Column(String(50), default="queued", index=True)
    tracking_token = Column(String(100), unique=True, nullable=True)
    
    metadata_json = Column(JSON, default=dict)

    sent_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
