from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class EmailPreviewRequest(BaseModel):
    template_type: str = Field(..., description="'invitation', 'rejection', hoặc 'offer'")
    candidate_ids: List[str] = Field(..., description="Danh sách ID ứng viên cần gửi")
    job_id: Optional[str] = None
    custom_tone_instruction: Optional[str] = Field(
        None, description="Chỉ dẫn tông giọng AI (ví dụ: 'Thân thiện, động viên', 'Trang trọng lịch sự')"
    )


class EmailPreviewItem(BaseModel):
    candidate_id: str
    recipient_email: str
    recipient_name: str
    subject: str
    body_html: str
    is_duplicate_warning: bool = False


class EmailPreviewResponse(BaseModel):
    template_type: str
    previews: List[EmailPreviewItem]


class SingleEmailSend(BaseModel):
    candidate_id: str
    recipient_email: EmailStr
    recipient_name: str
    subject: str
    body_html: str


class BulkEmailSendRequest(BaseModel):
    template_type: str
    emails: List[SingleEmailSend]


class BulkEmailSendResponse(BaseModel):
    total_queued: int
    skipped_duplicates: int
    task_id: str
    message: str


class EmailLogResponse(BaseModel):
    id: str
    candidate_id: Optional[str] = None
    template_name: Optional[str] = None
    email_type: str
    recipient_email: str
    recipient_name: str
    subject: str
    status: str
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
