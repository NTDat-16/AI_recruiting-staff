from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.candidate.schemas import (
    CandidateResponse,
    ApplicationResponse,
    PipelineStatusUpdate,
    HRFeedbackCreate,
    TalentPoolSearchQuery,
)
from app.modules.candidate.service import CandidateService
from app.shared.permissions import get_current_token_payload, RequireRoles, UserRole, TokenData

router = APIRouter(prefix="/candidates", tags=["Candidates & CVs"])


# --- Public Application Endpoint ---
@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def public_apply_job(
    job_id: str = Form(...),
    company_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Cổng nộp CV công khai của ứng viên."""
    file_bytes = None
    filename = None
    if cv_file:
        file_bytes = await cv_file.read()
        filename = cv_file.filename

    return await CandidateService.submit_application(
        db=db,
        company_id=company_id,
        job_id=job_id,
        full_name=full_name,
        email=email,
        phone=phone,
        file_bytes=file_bytes,
        filename=filename,
    )


# --- Protected HR Endpoints ---
@router.get(
    "",
    response_model=List[CandidateResponse],
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN]))],
)
async def list_candidates(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách ứng viên trong pipeline (có phân trang & lọc theo JD / trạng thái)."""
    return await CandidateService.list_candidates(
        db, company_id=current_user.company_id, job_id=job_id, status=status, skip=skip, limit=limit
    )


@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN]))],
)
async def get_candidate_detail(
    candidate_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Xem chi tiết hồ sơ ứng viên kèm điểm số và breakdown từ AI."""
    return await CandidateService.get_candidate(
        db, candidate_id=candidate_id, company_id=current_user.company_id
    )


@router.post(
    "/upload-cv",
    response_model=ApplicationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def hr_upload_candidate_cv(
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    cv_file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """HR upload hồ sơ CV ứng viên trực tiếp để AI parse và chấm điểm."""
    file_bytes = await cv_file.read()
    return await CandidateService.submit_application(
        db=db,
        company_id=current_user.company_id,
        job_id=job_id,
        full_name=full_name,
        email=email,
        phone=phone,
        file_bytes=file_bytes,
        filename=cv_file.filename,
    )


@router.patch(
    "/applications/{application_id}/pipeline-status",
    response_model=ApplicationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def update_pipeline_status(
    application_id: str,
    data: PipelineStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Chuyển trạng thái ứng viên trong quy trình tuyển dụng (Pipeline Kanban)."""
    return await CandidateService.update_pipeline_status(db, application_id=application_id, data=data)


@router.post(
    "/applications/{application_id}/score-feedback",
    response_model=ApplicationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def submit_score_feedback(
    application_id: str,
    feedback: HRFeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """Human-in-the-loop: HR gửi phản hồi về độ chính xác chấm điểm của AI."""
    return await CandidateService.submit_hr_feedback(db, application_id=application_id, feedback=feedback)


@router.post(
    "/talent-pool/search",
    response_model=List[CandidateResponse],
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def search_talent_pool(
    query: TalentPoolSearchQuery,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tìm kiếm ứng viên tiềm năng trong Talent Pool cho vị trí mới."""
    return await CandidateService.search_talent_pool(db, company_id=current_user.company_id, query=query)
