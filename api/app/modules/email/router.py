from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.email.schemas import (
    EmailPreviewRequest,
    EmailPreviewResponse,
    BulkEmailSendRequest,
    BulkEmailSendResponse,
    EmailLogResponse,
)
from app.modules.email.service import EmailService
from app.shared.permissions import get_current_token_payload, RequireRoles, UserRole, TokenData

router = APIRouter(prefix="/email", tags=["Email Automation"])


@router.post(
    "/preview",
    response_model=EmailPreviewResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def preview_bulk_emails(
    request: EmailPreviewRequest,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Xem trước (Preview) nội dung email cá nhân hóa từng ứng viên trước khi phát hành."""
    return await EmailService.preview_bulk_emails(db, company_id=current_user.company_id, request=request)


@router.post(
    "/send-bulk",
    response_model=BulkEmailSendResponse,
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def send_bulk_emails(
    request: BulkEmailSendRequest,
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Phát hành email hàng loạt (Tự động chống gửi trùng lặp cho cùng một ứng viên)."""
    return await EmailService.send_bulk_emails(db, company_id=current_user.company_id, request=request)


@router.get(
    "/logs",
    response_model=List[EmailLogResponse],
    dependencies=[Depends(RequireRoles([UserRole.HR, UserRole.COMPANY_ADMIN]))],
)
async def list_email_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Lịch sử và trạng thái email đã gửi."""
    return await EmailService.list_email_logs(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
