from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import logging
import uuid
from app.modules.interview.models import Interview
from app.modules.interview.schemas import (
    InterviewCreate,
    InterviewUpdate,
    CandidateConfirmInterview,
    CandidateEmailClassifyResponse,
)
from app.modules.interview.calendar_sync import CalendarSyncService
from app.modules.candidate.models import Application, Candidate
from app.modules.job_posting.models import JobPosting
from app.modules.email.sender import EmailSender
from app.modules.email.models import EmailLog
from app.ai.llm_client import get_llm_client
from app.shared.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class InterviewService:
    @staticmethod
    async def schedule_interview(
        db: AsyncSession, company_id: str, data: InterviewCreate
    ) -> Interview:
        # 1. Fetch application, candidate & job posting
        app_result = await db.execute(
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job_posting))
            .where(Application.id == data.application_id)
        )
        application = app_result.scalars().first()
        if not application:
            raise NotFoundException("Application", data.application_id)

        # 2. Check for double-booking conflict for the interviewer
        if data.interviewer_id:
            end_time = data.scheduled_time + timedelta(minutes=data.duration_minutes)
            conflict_result = await db.execute(
                select(Interview).where(
                    Interview.interviewer_id == data.interviewer_id,
                    Interview.confirmation_status != "declined",
                    Interview.scheduled_time < end_time,
                    Interview.scheduled_time + timedelta(minutes=45) > data.scheduled_time,
                )
            )
            conflict = conflict_result.scalars().first()
            if conflict:
                raise BadRequestException(
                    f"Người phỏng vấn đã có lịch trùng vào lúc {conflict.scheduled_time.strftime('%H:%M %d/%m/%Y')}"
                )

        # 3. Create calendar meeting link if online
        meeting_link = None
        if data.format == "online":
            cal_evt = await CalendarSyncService.create_calendar_event(
                title=f"{data.title} - {application.candidate.full_name}",
                start_time=data.scheduled_time,
                duration_minutes=data.duration_minutes,
                attendee_emails=[application.candidate.email],
            )
            meeting_link = cal_evt.get("meeting_link")

        # 4. Generate AI suggested questions
        llm = get_llm_client()
        questions_resp = await llm.generate_interview_questions(
            job_title=application.job_posting.title,
            job_requirements=application.job_posting.requirements,
            candidate_name=application.candidate.full_name,
            cv_summary=application.candidate.raw_text or str(application.candidate.parsed_data),
        )
        suggested_questions_json = [q.model_dump() for q in questions_resp.questions]

        # 5. Persist interview
        interview = Interview(
            application_id=data.application_id,
            company_id=company_id,
            interviewer_id=data.interviewer_id,
            title=data.title,
            round_number=data.round_number,
            scheduled_time=data.scheduled_time,
            duration_minutes=data.duration_minutes,
            format=data.format,
            meeting_link=meeting_link,
            location=data.location,
            confirmation_status="pending",
            ai_suggested_questions=suggested_questions_json,
        )
        db.add(interview)

        # Update candidate application status
        application.status = "interview_invited"

        await db.commit()
        await db.refresh(interview)

        # Dispatch real interview invitation email with active meeting room link
        try:
            cand = application.candidate
            job = application.job_posting
            time_str = data.scheduled_time.strftime('%H:%M ngày %d/%m/%Y')
            subject = f"[Thư Mời Phỏng Vấn] Vị trí {job.title} - {data.title}"

            meeting_info_html = ""
            if data.format == "online" and meeting_link:
                meeting_info_html = f"""
                <p><strong>Phòng họp trực tuyến (Jitsi Meet Video Conference):</strong></p>
                <p><a href="{meeting_link}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">💻 Bấm Vào Đây Để Tham Gia Phòng Họp Trực Tuyến</a></p>
                <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Link trực tiếp: <a href="{meeting_link}" target="_blank" style="color: #4f46e5;">{meeting_link}</a> (Hoạt động trên mọi trình duyệt Chrome, Edge, Firefox, Safari không cần đăng nhập)</p>
                """
            else:
                meeting_info_html = f"<p><strong>Địa điểm phỏng vấn:</strong> {data.location or 'Văn phòng công ty'}</p>"

            html_body = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
                    <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Thư Mời Tham Gia Phỏng Vấn Tuyển Dụng</h2>
                    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Hệ thống Tuyển dụng AI Tự động hóa</p>
                </div>
                <p>Kính gửi <strong>{cand.full_name}</strong>,</p>
                <p>Bộ phận Tuyển dụng trân trọng kính mời bạn tham gia buổi <strong>{data.title}</strong> (Vòng {data.round_number}) cho vị trí <strong>{job.title}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Thời gian:</strong> {time_str} ({data.duration_minutes} phút)</p>
                    <p style="margin: 0 0 8px 0;"><strong>Hình thức:</strong> {'Trực tuyến (Online)' if data.format == 'online' else 'Trực tiếp (Tại văn phòng)'}</p>
                    {meeting_info_html}
                </div>
                <p style="font-size: 13px; color: #475569;">Nếu bạn cần xác nhận tham gia, đề xuất đổi lịch hoặc có bất kỳ câu hỏi nào, vui lòng phản hồi lại trực tiếp email này.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Trân trọng,<br><strong>Ban Tuyển Dụng & Phát Triển Nhân Tài</strong></p>
            </div>
            """
            await EmailSender.send_email(
                to_email=cand.email,
                subject=subject,
                html_body=html_body,
            )
            email_log = EmailLog(
                company_id=company_id,
                candidate_id=cand.id,
                template_name="interview_invitation",
                email_type="invitation",
                recipient_email=cand.email,
                recipient_name=cand.full_name,
                subject=subject,
                body_html=html_body,
                status="sent",
                sent_at=datetime.now(timezone.utc),
                tracking_token=str(uuid.uuid4()),
            )
            db.add(email_log)
            await db.commit()
        except Exception as mail_err:
            logger.error(f"Lỗi khi gửi email mời phỏng vấn tự động: {mail_err}")

        return interview

    @staticmethod
    async def get_interview(db: AsyncSession, interview_id: str, company_id: Optional[str] = None) -> Interview:
        query = select(Interview).where(Interview.id == interview_id)
        if company_id:
            query = query.where(Interview.company_id == company_id)
        result = await db.execute(query)
        interview = result.scalars().first()
        if not interview:
            raise NotFoundException("Interview", interview_id)
        return interview

    @staticmethod
    async def list_interviews(
        db: AsyncSession,
        company_id: Optional[str] = None,
        interviewer_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Interview]:
        if not company_id:
            from app.modules.auth.models import Company
            comp_res = await db.execute(select(Company.id).order_by(Company.created_at.asc()).limit(1))
            company_id = comp_res.scalar_one_or_none()

        query = select(Interview)
        if company_id:
            query = query.where(Interview.company_id == company_id)
        if interviewer_id:
            query = query.where(Interview.interviewer_id == interviewer_id)
        if status:
            query = query.where(Interview.confirmation_status == status)
        query = query.offset(skip).limit(limit).order_by(Interview.scheduled_time.asc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def confirm_interview_by_candidate(
        db: AsyncSession, interview_id: str, data: CandidateConfirmInterview
    ) -> Interview:
        interview = await InterviewService.get_interview(db, interview_id)
        app_res = await db.execute(select(Application).where(Application.id == interview.application_id))
        application = app_res.scalars().first()

        now_str = datetime.now().strftime('%d/%m/%Y %H:%M')
        if data.action == "confirm":
            interview.confirmation_status = "confirmed"
            if application and application.status in ["new", "reviewing", "interview_invited"]:
                application.status = "interviewing"
                application.hr_notes = (application.hr_notes or "") + f"\n[{now_str}] Ứng viên xác nhận tham gia phỏng vấn."
        elif data.action == "reschedule":
            interview.confirmation_status = "reschedule_requested"
            if application:
                application.hr_notes = (application.hr_notes or "") + f"\n[{now_str}] Ứng viên yêu cầu dời lịch: {data.note or 'Không nêu lý do'}"
        elif data.action == "decline":
            interview.confirmation_status = "declined"
            if application:
                application.status = "rejected"
                application.hr_notes = (application.hr_notes or "") + f"\n[{now_str}] Ứng viên từ chối/hủy tham gia phỏng vấn: {data.note or 'Từ chối phỏng vấn'}"
        else:
            raise BadRequestException("Hành động xác nhận không hợp lệ ('confirm', 'reschedule', 'decline')")

        await db.commit()
        await db.refresh(interview)
        return interview

    @staticmethod
    async def generate_questions_for_interview(
        db: AsyncSession, interview_id: str, company_id: str
    ) -> List[dict]:
        interview = await InterviewService.get_interview(db, interview_id, company_id)
        app_result = await db.execute(
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job_posting))
            .where(Application.id == interview.application_id)
        )
        application = app_result.scalars().first()
        if not application:
            raise NotFoundException("Application for interview", interview_id)

        llm = get_llm_client()
        questions_resp = await llm.generate_interview_questions(
            job_title=application.job_posting.title,
            job_requirements=application.job_posting.requirements,
            candidate_name=application.candidate.full_name,
            cv_summary=application.candidate.raw_text or str(application.candidate.parsed_data),
        )
        questions = [q.model_dump() for q in questions_resp.questions]
        interview.ai_suggested_questions = questions
        await db.commit()
        await db.refresh(interview)
        return questions

    @staticmethod
    async def classify_email_response(
        db: AsyncSession,
        interview_id: str,
        company_id: str,
        email_content: str,
        auto_apply: bool = True,
    ) -> CandidateEmailClassifyResponse:
        interview = await InterviewService.get_interview(db, interview_id, company_id)
        app_result = await db.execute(
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job_posting))
            .where(Application.id == interview.application_id)
        )
        application = app_result.scalars().first()
        if not application:
            raise NotFoundException("Application", interview.application_id)

        candidate = application.candidate
        job = application.job_posting

        llm = get_llm_client()
        classification = await llm.classify_candidate_email_response(
            email_content=email_content,
            candidate_name=candidate.full_name,
            job_title=job.title,
            interview_title=interview.title,
        )

        applied_interview_status = interview.confirmation_status
        applied_candidate_status = application.status

        if auto_apply:
            now_str = datetime.now().strftime('%d/%m/%Y %H:%M')
            if classification.classification == "declined":
                interview.confirmation_status = "declined"
                application.status = "rejected"
                note_entry = f"\n[AI Phản Hồi Email - {now_str}] Ứng viên từ chối/hủy: {classification.summary}. Lý do: {classification.reason or 'Không nêu rõ'}"
                application.hr_notes = (application.hr_notes or "") + note_entry
            elif classification.classification == "accepted":
                interview.confirmation_status = "confirmed"
                # Keep or progress to interviewing
                application.status = "interviewing" if application.status in ["new", "reviewing", "interview_invited"] else application.status
                note_entry = f"\n[AI Phản Hồi Email - {now_str}] Ứng viên xác nhận tham gia: {classification.summary}"
                application.hr_notes = (application.hr_notes or "") + note_entry
            elif classification.classification == "reschedule_requested":
                interview.confirmation_status = "reschedule_requested"
                note_entry = f"\n[AI Phản Hồi Email - {now_str}] Ứng viên xin dời lịch: {classification.summary}. Thời gian đề xuất: {classification.proposed_time or 'Chưa xác định'}"
                application.hr_notes = (application.hr_notes or "") + note_entry

            applied_interview_status = interview.confirmation_status
            applied_candidate_status = application.status
            await db.commit()
            await db.refresh(interview)
            await db.refresh(application)

        return CandidateEmailClassifyResponse(
            interview_id=interview.id,
            candidate_id=candidate.id,
            candidate_name=candidate.full_name,
            classification=classification.classification,
            confidence=classification.confidence,
            sentiment=classification.sentiment,
            summary=classification.summary,
            reason=classification.reason,
            proposed_time=classification.proposed_time,
            applied_interview_status=applied_interview_status,
            applied_candidate_status=applied_candidate_status,
            message=f"Đã phân loại ý định ứng viên thành công: '{classification.classification}' ({classification.summary})"
        )

    @staticmethod
    async def send_invitation_email(
        db: AsyncSession,
        interview_id: str,
        company_id: str,
    ) -> dict:
        interview = await InterviewService.get_interview(db, interview_id, company_id)
        app_result = await db.execute(
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job_posting))
            .where(Application.id == interview.application_id)
        )
        application = app_result.scalars().first()
        if not application:
            raise NotFoundException("Application", interview.application_id)

        cand = application.candidate
        job = application.job_posting
        time_str = interview.scheduled_time.strftime('%H:%M ngày %d/%m/%Y')
        subject = f"[Thư Mời Phỏng Vấn] Vị trí {job.title} - {interview.title}"

        meeting_info_html = ""
        if interview.format == "online" and interview.meeting_link:
            meeting_info_html = f"""
            <p><strong>Phòng họp trực tuyến (Jitsi Meet Video Conference):</strong></p>
            <p><a href="{interview.meeting_link}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">💻 Bấm Vào Đây Để Tham Gia Phòng Họp Trực Tuyến</a></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Link trực tiếp: <a href="{interview.meeting_link}" target="_blank" style="color: #4f46e5;">{interview.meeting_link}</a> (Hoạt động trên mọi trình duyệt không cần cài đặt)</p>
            """
        else:
            meeting_info_html = f"<p><strong>Địa điểm phỏng vấn:</strong> {interview.location or 'Văn phòng công ty'}</p>"

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Thư Mời Tham Gia Phỏng Vấn Tuyển Dụng</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Hệ thống Tuyển dụng AI Tự động hóa</p>
            </div>
            <p>Kính gửi <strong>{cand.full_name}</strong>,</p>
            <p>Bộ phận Tuyển dụng trân trọng gửi lại thông tin buổi <strong>{interview.title}</strong> (Vòng {interview.round_number}) cho vị trí <strong>{job.title}</strong>.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Thời gian:</strong> {time_str} ({interview.duration_minutes} phút)</p>
                <p style="margin: 0 0 8px 0;"><strong>Hình thức:</strong> {'Trực tuyến (Online)' if interview.format == 'online' else 'Trực tiếp (Tại văn phòng)'}</p>
                {meeting_info_html}
            </div>
            <p style="font-size: 13px; color: #475569;">Nếu bạn cần xác nhận tham gia, đề xuất đổi lịch hoặc có bất kỳ câu hỏi nào, vui lòng phản hồi lại trực tiếp email này.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Trân trọng,<br><strong>Ban Tuyển Dụng & Phát Triển Nhân Tài</strong></p>
        </div>
        """

        send_res = await EmailSender.send_email(
            to_email=cand.email,
            subject=subject,
            html_body=html_body,
        )
        email_log = EmailLog(
            company_id=company_id,
            candidate_id=cand.id,
            template_name="interview_invitation",
            email_type="invitation",
            recipient_email=cand.email,
            recipient_name=cand.full_name,
            subject=subject,
            body_html=html_body,
            status="sent" if send_res.get("success") else "failed",
            sent_at=datetime.now(timezone.utc),
            tracking_token=str(uuid.uuid4()),
        )
        db.add(email_log)
        await db.commit()

        return {
            "success": True,
            "message": f"Đã gửi thư mời phỏng vấn tới ứng viên {cand.full_name} ({cand.email}).",
            "delivery_mode": send_res.get("mode"),
            "meeting_link": interview.meeting_link,
        }

