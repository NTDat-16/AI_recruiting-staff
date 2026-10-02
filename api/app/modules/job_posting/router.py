from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.job_posting.schemas import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    PublicJobPostingResponse,
)
from app.modules.job_posting.service import JobPostingService
from app.shared.permissions import get_current_token_payload, RequireRoles, UserRole, TokenData

router = APIRouter(prefix="/jobs", tags=["Job Postings"])


# --- Public Endpoints (Candidates) ---
@router.get("/public", response_model=List[PublicJobPostingResponse])
async def list_public_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách tin tuyển dụng công khai cho ứng viên."""
    return await JobPostingService.list_public_jobs(db, skip=skip, limit=limit)


@router.get("/public/{slug}", response_model=PublicJobPostingResponse)
async def get_public_job_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Xem chi tiết tin tuyển dụng công khai theo slug (SEO-friendly)."""
    return await JobPostingService.get_job_by_slug(db, slug=slug)


# --- Protected Endpoints (HR & Company Admin) ---
@router.post(
    "",
    response_model=JobPostingResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def create_job(
    data: JobPostingCreate,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tạo tin tuyển dụng mới kèm cấu hình trọng số chấm điểm AI."""
    return await JobPostingService.create_job(
        db, company_id=current_user.company_id, user_id=current_user.user_id, data=data
    )


@router.get(
    "",
    response_model=List[JobPostingResponse],
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def list_company_jobs(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Danh sách tin tuyển dụng của công ty (HR dashboard)."""
    return await JobPostingService.list_jobs(
        db, company_id=current_user.company_id, status=status, skip=skip, limit=limit
    )


@router.get(
    "/{job_id}",
    response_model=JobPostingResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def get_job_detail(
    job_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Lấy chi tiết tin tuyển dụng nội bộ."""
    return await JobPostingService.get_job_by_id(db, job_id=job_id, company_id=current_user.company_id)


@router.patch(
    "/{job_id}",
    response_model=JobPostingResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def update_job(
    job_id: str,
    data: JobPostingUpdate,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật thông tin tin tuyển dụng."""
    return await JobPostingService.update_job(
        db, job_id=job_id, company_id=current_user.company_id, data=data
    )


@router.post(
    "/{job_id}/publish",
    response_model=JobPostingResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def publish_job(
    job_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Công khai tin tuyển dụng lên trang tuyển dụng."""
    return await JobPostingService.change_status(
        db, job_id=job_id, company_id=current_user.company_id, new_status="published"
    )


@router.post(
    "/{job_id}/close",
    response_model=JobPostingResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]))],
)
async def close_job(
    job_id: str,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Đóng tin tuyển dụng."""
    return await JobPostingService.change_status(
        db, job_id=job_id, company_id=current_user.company_id, new_status="closed"
    )
