from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.interview.schemas import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    CandidateConfirmInterview,
    CandidateEmailClassifyRequest,
    CandidateEmailClassifyResponse,
)
from app.modules.interview.service import InterviewService
from app.shared.permissions import get_current_token_payload, get_optional_token_payload, RequireRoles, UserRole, TokenData

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def schedule_interview(
    data: InterviewCreate,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Đặt lịch phỏng vấn mới (tự động chống trùng lịch & sinh gợi ý câu hỏi AI)."""
    return await InterviewService.schedule_interview(
        db, company_id=current_user.company_id, data=data
    )


@router.get(
    "",
    response_model=List[InterviewResponse],
)
async def list_interviews(
    status: Optional[str] = None,
    interviewer_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách các buổi phỏng vấn."""
    company_id = current_user.company_id if current_user else None
    return await InterviewService.list_interviews(
        db,
        company_id=company_id,
        interviewer_id=interviewer_id,
        status=status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def get_interview_detail(
    interview_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Xem chi tiết buổi phỏng vấn."""
    return await InterviewService.get_interview(db, interview_id=interview_id, company_id=current_user.company_id)


@router.post(
    "/{interview_id}/suggest-questions",
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def generate_suggested_questions(
    interview_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Yêu cầu AI sinh lại bộ câu hỏi phỏng vấn chuyên sâu theo JD và CV."""
    questions = await InterviewService.generate_questions_for_interview(
        db, interview_id=interview_id, company_id=current_user.company_id
    )
    return {"interview_id": interview_id, "questions": questions}


# Public or Candidate route for confirmation
@router.post("/{interview_id}/confirm", response_model=InterviewResponse)
async def candidate_confirm_interview(
    interview_id: str,
    data: CandidateConfirmInterview,
    db: AsyncSession = Depends(get_db),
):
    """Ứng viên xác nhận / đề xuất dời / từ chối lịch phỏng vấn."""
    return await InterviewService.confirm_interview_by_candidate(db, interview_id=interview_id, data=data)


@router.post(
    "/{interview_id}/classify-email-response",
    response_model=CandidateEmailClassifyResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def classify_candidate_email_response(
    interview_id: str,
    data: CandidateEmailClassifyRequest,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Phân loại phản hồi email của ứng viên (đồng ý, từ chối, xin dời lịch) bằng AI và tự động cập nhật trạng thái."""
    return await InterviewService.classify_email_response(
        db,
        interview_id=interview_id,
        company_id=current_user.company_id,
        email_content=data.email_content,
        auto_apply=data.auto_apply,
    )


@router.post(
    "/{interview_id}/send-invitation-email",
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def send_interview_invitation_email(
    interview_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Phát hành hoặc gửi lại email mời phỏng vấn (kèm link phòng họp trực tuyến Jitsi Meet thực tế)."""
    return await InterviewService.send_invitation_email(
        db, interview_id=interview_id, company_id=current_user.company_id
    )

