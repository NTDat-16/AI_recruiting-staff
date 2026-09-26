from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.modules.interview.models import Interview
from app.modules.interview.schemas import InterviewCreate, InterviewUpdate, CandidateConfirmInterview
from app.modules.interview.calendar_sync import CalendarSyncService
from app.modules.candidate.models import Application, Candidate
from app.modules.job_posting.models import JobPosting
from app.ai.llm_client import get_llm_client
from app.shared.exceptions import NotFoundException, BadRequestException


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
        company_id: str,
        interviewer_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Interview]:
        query = select(Interview).where(Interview.company_id == company_id)
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
        if data.action == "confirm":
            interview.confirmation_status = "confirmed"
        elif data.action == "reschedule":
            interview.confirmation_status = "reschedule_requested"
        elif data.action == "decline":
            interview.confirmation_status = "declined"
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
