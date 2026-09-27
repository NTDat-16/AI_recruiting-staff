from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ManualRubricItem(BaseModel):
    criterion: str = Field(..., example="Chuyên môn kỹ thuật")
    score: float = Field(..., ge=1, le=10, example=8.5)
    comment: Optional[str] = Field(None, example="Nắm chắc FastAPI và Redis caching")


class ManualEvaluationCreate(BaseModel):
    interview_id: str
    manual_score: float = Field(..., ge=1, le=10)
    manual_rubric_scores: List[ManualRubricItem] = []
    manual_notes: Optional[str] = None


class InterviewEvaluationResponse(BaseModel):
    id: str
    interview_id: str
    application_id: str
    interviewer_id: Optional[str] = None
    manual_score: Optional[float] = None
    manual_rubric_scores: List[Dict[str, Any]] = []
    manual_notes: Optional[str] = None
    audio_file_url: Optional[str] = None
    transcript: List[Dict[str, Any]] = []
    ai_rating: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_rubric_scores: List[Dict[str, Any]] = []
    ai_strengths: List[str] = []
    ai_weaknesses: List[str] = []
    ai_recommendation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsolidatedReportResponse(BaseModel):
    evaluation_id: str
    interview_id: str
    candidate_name: str
    job_title: str
    scheduled_time: datetime
    manual_evaluation: Dict[str, Any]
    ai_evaluation: Dict[str, Any]
    final_decision_guideline: str = "Đánh giá AI chỉ mang tính chất tham khảo. Quyết định cuối cùng thuộc về HR / Quản lý tuyển dụng."
