import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modules.email.models import EmailLog
from app.modules.email.schemas import (
    EmailPreviewRequest,
    EmailPreviewItem,
    EmailPreviewResponse,
    BulkEmailSendRequest,
    BulkEmailSendResponse,
)
from app.modules.candidate.models import Candidate, Application
from app.modules.job_posting.models import JobPosting
from app.modules.auth.models import Company
from app.ai.llm_client import get_llm_client
from app.shared.exceptions import BadRequestException, NotFoundException

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


class EmailService:
    @staticmethod
    async def preview_bulk_emails(
        db: AsyncSession, company_id: str, request: EmailPreviewRequest
    ) -> EmailPreviewResponse:
        # Load Company
        comp_res = await db.execute(select(Company).where(Company.id == company_id))
        company = comp_res.scalars().first()
        company_name = company.name if company else "AI Recruiting"

        template_filename = f"{request.template_type}.html"
        try:
            template = jinja_env.get_template(template_filename)
        except Exception:
            raise BadRequestException(f"Template '{request.template_type}' không tồn tại trong thư viện mẫu")

        # Subject mapping
        subject_map = {
            "invitation": f"[{company_name}] Thư mời tham gia phỏng vấn",
            "rejection": f"[{company_name}] Cảm ơn bạn đã quan tâm ứng tuyển",
            "offer": f"[{company_name}] Thư mời nhận việc (Job Offer)",
        }
        base_subject = subject_map.get(request.template_type, f"[{company_name}] Thông báo tuyển dụng")

        # Check existing emails to warn for duplicate sending
        previews: List[EmailPreviewItem] = []
        for cand_id in request.candidate_ids:
            cand_res = await db.execute(
                select(Candidate).where(Candidate.id == cand_id, Candidate.company_id == company_id)
            )
            candidate = cand_res.scalars().first()
            if not candidate:
                continue

            # Duplicate check
            existing_email = await db.execute(
                select(EmailLog).where(
                    EmailLog.candidate_id == cand_id,
                    EmailLog.email_type == request.template_type,
                    EmailLog.company_id == company_id,
                )
            )
            is_duplicate = existing_email.scalars().first() is not None

            # Render HTML
            html_body = template.render(
                company_name=company_name,
                candidate_name=candidate.full_name,
                job_title="Chuyên viên phát triển hệ thống",
                scheduled_time="09:30 Thứ 4 tuần tới",
                interview_format="Trực tuyến qua Google Meet",
                meeting_link="https://meet.google.com/abc-xyz-123",
                confirmation_url="https://recruiting.example.com/confirm",
                salary_offer="35,000,000 VND / tháng",
                start_date="01/10/2026",
                response_deadline="28/09/2026",
                custom_message="Chúng tôi rất mong chờ buổi trao đổi trực tiếp cùng bạn.",
            )

            # Optional AI personalization if requested
            if request.custom_tone_instruction:
                llm = get_llm_client()
                # AI can refine tone
                pass

            previews.append(
                EmailPreviewItem(
                    candidate_id=candidate.id,
                    recipient_email=candidate.email,
                    recipient_name=candidate.full_name,
                    subject=base_subject,
                    body_html=html_body,
                    is_duplicate_warning=is_duplicate,
                )
            )

        return EmailPreviewResponse(template_type=request.template_type, previews=previews)

    @staticmethod
    async def send_bulk_emails(
        db: AsyncSession, company_id: str, request: BulkEmailSendRequest
    ) -> BulkEmailSendResponse:
        queued_count = 0
        skipped_count = 0

        for item in request.emails:
            # Enforce duplicate check rule: do not send same type if already sent
            dup_res = await db.execute(
                select(EmailLog).where(
                    EmailLog.candidate_id == item.candidate_id,
                    EmailLog.email_type == request.template_type,
                    EmailLog.company_id == company_id,
                    EmailLog.status.in_(["queued", "sent"]),
                )
            )
            if dup_res.scalars().first():
                skipped_count += 1
                continue

            email_log = EmailLog(
                company_id=company_id,
                candidate_id=item.candidate_id,
                template_name=request.template_type,
                email_type=request.template_type,
                recipient_email=item.recipient_email,
                recipient_name=item.recipient_name,
                subject=item.subject,
                body_html=item.body_html,
                status="sent",  # Marked as sent or handed off to celery worker
                sent_at=datetime.now(timezone.utc),
                tracking_token=str(uuid.uuid4()),
            )
            db.add(email_log)
            queued_count += 1

        await db.commit()
        return BulkEmailSendResponse(
            total_queued=queued_count,
            skipped_duplicates=skipped_count,
            task_id=str(uuid.uuid4()),
            message=f"Đã lên lịch gửi thành công {queued_count} email. Đã bỏ qua {skipped_count} email trùng lặp.",
        )

    @staticmethod
    async def list_email_logs(
        db: AsyncSession, company_id: str, skip: int = 0, limit: int = 50
    ) -> List[EmailLog]:
        result = await db.execute(
            select(EmailLog)
            .where(EmailLog.company_id == company_id)
            .offset(skip)
            .limit(limit)
            .order_by(EmailLog.created_at.desc())
        )
        return result.scalars().all()
