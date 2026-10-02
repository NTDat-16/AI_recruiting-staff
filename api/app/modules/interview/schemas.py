from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.ai.schemas import SuggestedQuestion


class InterviewCreate(BaseModel):
    application_id: str
    interviewer_id: Optional[str] = None
    title: str = Field(..., example="Phỏng vấn Kỹ thuật Vòng 1")
    round_number: int = Field(1, ge=1)
    scheduled_time: datetime
    duration_minutes: int = Field(45, ge=15, le=180)
    format: str = Field("online", description="'online' hoặc 'offline'")
    location: Optional[str] = Field(None, example="Phòng họp 302, Tòa nhà Innovation")


class InterviewUpdate(BaseModel):
    interviewer_id: Optional[str] = None
    title: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    format: Optional[str] = None
    location: Optional[str] = None
    confirmation_status: Optional[str] = None


class CandidateConfirmInterview(BaseModel):
    action: str = Field(..., description="'confirm', 'reschedule', hoặc 'decline'")
    note: Optional[str] = Field(None, description="Lý do hoặc đề xuất khung giờ mới")


class InterviewResponse(BaseModel):
    id: str
    application_id: str
    company_id: str
    interviewer_id: Optional[str] = None
    title: str
    round_number: int
    scheduled_time: datetime
    duration_minutes: int
    format: str
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    confirmation_status: str
    ai_suggested_questions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateEmailClassifyRequest(BaseModel):
    email_content: str = Field(..., description="Nội dung email phản hồi từ ứng viên")
    auto_apply: bool = Field(True, description="Tự động cập nhật trạng thái phỏng vấn và ứng viên")


class CandidateEmailClassifyResponse(BaseModel):
    interview_id: str
    candidate_id: str
    candidate_name: str
    classification: str
    confidence: float
    sentiment: str
    summary: str
    reason: Optional[str] = None
    proposed_time: Optional[str] = None
    applied_interview_status: str
    applied_candidate_status: Optional[str] = None
    message: str
