from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.interview.schemas import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    CandidateConfirmInterview,
)
from app.modules.interview.service import InterviewService
from app.shared.permissions import get_current_token_payload, RequireRoles, UserRole, TokenData

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
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def list_interviews(
    status: Optional[str] = None,
    interviewer_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách các buổi phỏng vấn."""
    return await InterviewService.list_interviews(
        db,
        company_id=current_user.company_id,
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
