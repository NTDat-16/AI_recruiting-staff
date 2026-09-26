from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.evaluation.schemas import (
    ManualEvaluationCreate,
    InterviewEvaluationResponse,
    ConsolidatedReportResponse,
)
from app.modules.evaluation.service import EvaluationService
from app.shared.permissions import get_current_token_payload, RequireRoles, UserRole, TokenData

router = APIRouter(prefix="/evaluations", tags=["Interview Evaluations"])


@router.post(
    "/manual",
    response_model=InterviewEvaluationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def submit_manual_evaluation(
    data: ManualEvaluationCreate,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Interviewer nhập kết quả đánh giá phỏng vấn thủ công theo rubric."""
    return await EvaluationService.submit_manual_evaluation(
        db, data=data, user_id=current_user.user_id
    )


@router.post(
    "/upload-audio",
    response_model=InterviewEvaluationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def upload_interview_audio(
    interview_id: str = Form(...),
    candidate_consent: bool = Form(..., description="Xác nhận ứng viên đã đồng ý ghi âm"),
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload file ghi âm buổi phỏng vấn -> AI chuyển giọng nói sang văn bản và phân tích rubric."""
    return await EvaluationService.process_interview_audio(
        db,
        interview_id=interview_id,
        audio_filename=audio_file.filename,
        candidate_consent=candidate_consent,
    )


@router.get(
    "/interview/{interview_id}/consolidated-report",
    response_model=ConsolidatedReportResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER]))],
)
async def get_consolidated_report(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Lấy báo cáo đánh giá hợp nhất (Đánh giá thủ công của người PV + Phân tích AI)."""
    return await EvaluationService.get_consolidated_report(db, interview_id=interview_id)
