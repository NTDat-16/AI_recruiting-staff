from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    source: Optional[str] = "direct_apply"
    tags: Optional[List[str]] = []
    hr_notes: Optional[str] = None


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    tags: Optional[List[str]] = None
    hr_notes: Optional[str] = None
    rating: Optional[float] = None


class PipelineStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="Trạng thái: new, reviewing, interview_invited, interviewed, offered, hired, rejected, talent_pool",
    )
    hr_notes: Optional[str] = None


class HRFeedbackCreate(BaseModel):
    accuracy_rating: int = Field(..., ge=1, le=5, description="Đánh giá độ chính xác của AI từ 1 đến 5 sao")
    comment: Optional[str] = Field(None, description="Góp ý để cải thiện thuật toán chấm điểm")


class ApplicationResponse(BaseModel):
    id: str
    job_posting_id: str
    candidate_id: str
    match_score: Optional[float] = None
    score_breakdown: Optional[Dict[str, Any]] = None
    status: str
    hr_notes: Optional[str] = None
    hr_feedback: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateResponse(BaseModel):
    id: str
    company_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    cv_file_url: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    hr_notes: Optional[str] = None
    rating: float = 0.0
    source: str
    created_at: datetime
    applications: List[ApplicationResponse] = []

    class Config:
        from_attributes = True


class TalentPoolSearchQuery(BaseModel):
    skills: List[str] = []
    keyword: Optional[str] = None
    min_rating: Optional[float] = None
