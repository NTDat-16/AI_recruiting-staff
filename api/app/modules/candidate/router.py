from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.candidate.schemas import (
    CandidateResponse,
    ApplicationResponse,
    PipelineStatusUpdate,
    HRFeedbackCreate,
    TalentPoolSearchQuery,
    CandidateTrackItem,
    CareerChatRequest,
    CareerChatResponse,
    RediscoverCandidateRequest,
    AnalyticsCopilotRequest,
    AnalyticsCopilotResponse,
)
from app.modules.candidate.service import CandidateService
from app.shared.permissions import get_current_token_payload, get_optional_token_payload, RequireRoles, UserRole, TokenData


router = APIRouter(prefix="/candidates", tags=["Candidates & CVs"])


# --- Public Candidate Endpoints (No Auth Needed) ---
@router.get("/track/status", response_model=List[CandidateTrackItem])
async def track_application_status(
    email: Optional[str] = Query(None, description="Email ứng viên đã dùng nộp đơn"),
    tracking_code: Optional[str] = Query(None, description="Mã hồ sơ hoặc Application ID"),
    db: AsyncSession = Depends(get_db),
):
    """Tra cứu trạng thái hồ sơ ứng tuyển công khai bằng Email và/hoặc Mã hồ sơ mà không bắt buộc tạo tài khoản."""
    if not email and not tracking_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng cung cấp Email hoặc Mã hồ sơ (Tracking Code) để tra cứu tiến độ ứng tuyển."
        )
    return await CandidateService.track_applications(db, email=email, tracking_code=tracking_code)


@router.post("/career-chat", response_model=CareerChatResponse)
async def public_career_chat(
    payload: CareerChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """AI Chatbot tư vấn việc làm và quy trình ứng tuyển 24/7."""
    return await CandidateService.career_chat(db, message=payload.message, history=payload.history)


# --- Public Application Endpoint ---
@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def public_apply_job(
    job_id: str = Form(...),
    company_id: Optional[str] = Form(None),
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
)
async def list_candidates(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách ứng viên trong pipeline (có phân trang & lọc theo JD / trạng thái)."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.list_candidates(
        db, company_id=company_id, job_id=job_id, status=status, skip=skip, limit=limit
    )


@router.get("/overview/stats")
async def get_overview_stats(
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Thống kê tổng quan thực tế từ CSDL phục vụ Dashboard: số JD, ứng viên, phỏng vấn, điểm TB AI, phễu tuyển dụng."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.get_overview_stats(db, company_id=company_id)


@router.get("/notifications")
async def get_notifications(
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Luồng thông báo thời gian thực phục vụ chuông thông báo (Bell Notifications Drawer)."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.get_notifications(db, company_id=company_id)


@router.get("/analytics/reports")
async def get_detailed_analytics_report(
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Báo cáo phân tích tuyển dụng nâng cao (Funnel, Time-to-Hire, Sources, Departments, AI Score Distribution)."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.get_detailed_analytics_report(db, company_id=company_id)


@router.post("/analytics/copilot", response_model=AnalyticsCopilotResponse)
async def run_analytics_copilot(
    payload: AnalyticsCopilotRequest,
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """AI Analytics Copilot: Truy vấn dữ liệu tuyển dụng & Root Cause Analysis."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.analytics_copilot(
        db,
        query=payload.query,
        time_range=payload.time_range or "30_days",
        department=payload.department or "all",
        company_id=company_id,
    )



@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
)
async def get_candidate_detail(
    candidate_id: str,
    current_user: Optional[TokenData] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Xem chi tiết hồ sơ ứng viên kèm điểm số và breakdown từ AI."""
    company_id = current_user.company_id if current_user else None
    return await CandidateService.get_candidate(
        db, candidate_id=candidate_id, company_id=company_id
    )


@router.get("/{candidate_id}/avatar")
async def get_candidate_avatar(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Lấy ảnh đại diện (avatar) của ứng viên nếu có trong CV."""
    from fastapi.responses import FileResponse, Response
    candidate = await CandidateService.get_candidate(
        db, candidate_id=candidate_id, company_id=None
    )
    if not candidate or not candidate.avatar_url:
        return Response(status_code=status.HTTP_404_NOT_FOUND, content="Candidate avatar not found")

    import os
    clean_path = candidate.avatar_url.lstrip("/")
    file_path = os.path.join(os.getcwd(), clean_path)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")

    return Response(status_code=status.HTTP_404_NOT_FOUND, content="Avatar file not found on disk")


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
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Chuyển trạng thái ứng viên trong quy trình tuyển dụng (Pipeline Kanban)."""
    return await CandidateService.update_pipeline_status(
        db, application_id=application_id, data=data, company_id=current_user.company_id
    )


@router.post(
    "/applications/{application_id}/score-feedback",
    response_model=ApplicationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def submit_score_feedback(
    application_id: str,
    feedback: HRFeedbackCreate,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Human-in-the-loop: HR gửi phản hồi về độ chính xác chấm điểm của AI."""
    return await CandidateService.submit_hr_feedback(
        db, application_id=application_id, feedback=feedback, company_id=current_user.company_id
    )


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


@router.post(
    "/{candidate_id}/rediscover",
    response_model=ApplicationResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def rediscover_candidate(
    candidate_id: str,
    payload: RediscoverCandidateRequest,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """AI Talent Rediscovery: Tái kết nối ứng viên từ Talent Pool vào một Job mới."""
    return await CandidateService.rediscover_candidate(
        db=db,
        candidate_id=candidate_id,
        new_job_id=payload.job_id,
        company_id=current_user.company_id,
    )
