from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.modules.evaluation.models import InterviewEvaluation
from app.modules.evaluation.schemas import ManualEvaluationCreate, ConsolidatedReportResponse
from app.modules.interview.models import Interview
from app.modules.candidate.models import Application, Candidate
from app.modules.job_posting.models import JobPosting
from app.ai.stt import get_stt_client
from app.ai.llm_client import get_llm_client
from app.shared.exceptions import NotFoundException, BadRequestException


class EvaluationService:
    @staticmethod
    async def get_or_create_evaluation(
        db: AsyncSession, interview_id: str, interviewer_id: Optional[str] = None
    ) -> InterviewEvaluation:
        result = await db.execute(
            select(InterviewEvaluation).where(InterviewEvaluation.interview_id == interview_id)
        )
        evaluation = result.scalars().first()
        if not evaluation:
            # Look up interview to find application_id
            int_res = await db.execute(select(Interview).where(Interview.id == interview_id))
            interview = int_res.scalars().first()
            if not interview:
                raise NotFoundException("Interview", interview_id)

            evaluation = InterviewEvaluation(
                interview_id=interview_id,
                application_id=interview.application_id,
                interviewer_id=interviewer_id or interview.interviewer_id,
            )
            db.add(evaluation)
            await db.flush()
        return evaluation

    @staticmethod
    async def submit_manual_evaluation(
        db: AsyncSession, data: ManualEvaluationCreate, user_id: str
    ) -> InterviewEvaluation:
        evaluation = await EvaluationService.get_or_create_evaluation(db, data.interview_id, user_id)
        evaluation.manual_score = data.manual_score
        evaluation.manual_rubric_scores = [item.model_dump() for item in data.manual_rubric_scores]
        evaluation.manual_notes = data.manual_notes
        evaluation.interviewer_id = user_id

        # Update candidate application status to interviewed
        app_res = await db.execute(select(Application).where(Application.id == evaluation.application_id))
        app = app_res.scalars().first()
        if app and app.status in ["new", "reviewing", "interview_invited"]:
            app.status = "interviewed"

        await db.commit()
        await db.refresh(evaluation)
        return evaluation

    @staticmethod
    async def process_interview_audio(
        db: AsyncSession,
        interview_id: str,
        audio_filename: str,
        candidate_consent: bool,
    ) -> InterviewEvaluation:
        if not candidate_consent:
            raise BadRequestException(
                "Yêu cầu sự đồng ý rõ ràng (consent) của ứng viên trước khi xử lý và phân tích file ghi âm phỏng vấn."
            )

        evaluation = await EvaluationService.get_or_create_evaluation(db, interview_id)
        evaluation.audio_file_url = f"/storage/interviews/{interview_id}_{audio_filename}"
        evaluation.candidate_audio_consent = "yes"

        # 1. Speech to Text with Diarization
        stt_client = get_stt_client()
        transcript_segments = await stt_client.transcribe_audio(evaluation.audio_file_url)
        evaluation.transcript = [seg.model_dump() for seg in transcript_segments]

        # 2. Get JD for rubric evaluation
        int_res = await db.execute(
            select(Interview)
            .options(
                selectinload(Interview.application).selectinload(Application.job_posting),
            )
            .where(Interview.id == interview_id)
        )
        interview = int_res.scalars().first()
        job = interview.application.job_posting

        transcript_text = "\n".join(
            [f"[{seg.speaker} - {seg.start_time}s]: {seg.text}" for seg in transcript_segments]
        )

        # 3. Call AI LLM to analyze transcript against rubric
        llm = get_llm_client()
        ai_eval = await llm.evaluate_interview_transcript(
            job_requirements=f"{job.title}\n{job.requirements}",
            rubric_criteria="Chuyên môn kỹ thuật, Giải quyết vấn đề, Giao tiếp, Mức độ phù hợp văn hóa",
            transcript_text=transcript_text,
        )

        evaluation.ai_rating = ai_eval.overall_rating
        evaluation.ai_summary = ai_eval.summary
        evaluation.ai_rubric_scores = [r.model_dump() for r in ai_eval.rubric_scores]
        evaluation.ai_strengths = ai_eval.key_strengths
        evaluation.ai_weaknesses = ai_eval.areas_for_growth
        evaluation.ai_recommendation = ai_eval.recommendation

        await db.commit()
        await db.refresh(evaluation)
        return evaluation

    @staticmethod
    async def get_consolidated_report(db: AsyncSession, interview_id: str) -> ConsolidatedReportResponse:
        int_res = await db.execute(
            select(Interview)
            .options(
                selectinload(Interview.application).selectinload(Application.candidate),
                selectinload(Interview.application).selectinload(Application.job_posting),
                selectinload(Interview.evaluation),
            )
            .where(Interview.id == interview_id)
        )
        interview = int_res.scalars().first()
        if not interview:
            raise NotFoundException("Interview", interview_id)

        evaluation = interview.evaluation
        if not evaluation:
            raise NotFoundException("InterviewEvaluation for interview", interview_id)

        return ConsolidatedReportResponse(
            evaluation_id=evaluation.id,
            interview_id=interview.id,
            candidate_name=interview.application.candidate.full_name,
            job_title=interview.application.job_posting.title,
            scheduled_time=interview.scheduled_time,
            manual_evaluation={
                "score": evaluation.manual_score,
                "rubric_scores": evaluation.manual_rubric_scores,
                "notes": evaluation.manual_notes,
            },
            ai_evaluation={
                "rating": evaluation.ai_rating,
                "summary": evaluation.ai_summary,
                "rubric_scores": evaluation.ai_rubric_scores,
                "strengths": evaluation.ai_strengths,
                "weaknesses": evaluation.ai_weaknesses,
                "recommendation": evaluation.ai_recommendation,
                "transcript": evaluation.transcript,
            },
        )
