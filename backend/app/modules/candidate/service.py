from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.modules.candidate.models import Candidate, Application
from app.modules.candidate.schemas import (
    CandidateCreate,
    CandidateUpdate,
    PipelineStatusUpdate,
    HRFeedbackCreate,
    TalentPoolSearchQuery,
)
from app.modules.candidate.cv_parser import CVParser
from app.modules.job_posting.models import JobPosting
from app.ai.llm_client import get_llm_client
from app.ai.embeddings import embedding_client
from app.shared.exceptions import NotFoundException, BadRequestException


class CandidateService:
    @staticmethod
    async def get_or_create_candidate(
        db: AsyncSession, company_id: str, email: str, full_name: str, phone: Optional[str] = None
    ) -> Candidate:
        # Check duplicate candidate by email
        result = await db.execute(
            select(Candidate).where(Candidate.company_id == company_id, Candidate.email == email)
        )
        candidate = result.scalars().first()
        if not candidate:
            candidate = Candidate(
                company_id=company_id,
                email=email,
                full_name=full_name,
                phone=phone,
            )
            db.add(candidate)
            await db.flush()
        else:
            if full_name:
                candidate.full_name = full_name
            if phone:
                candidate.phone = phone
        return candidate

    @staticmethod
    async def submit_application(
        db: AsyncSession,
        company_id: str,
        job_id: str,
        full_name: str,
        email: str,
        phone: Optional[str],
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        raw_text_input: Optional[str] = None,
    ) -> Application:
        # 1. Verify JobPosting exists
        job_result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
        job = job_result.scalars().first()
        if not job:
            raise NotFoundException("JobPosting", job_id)

        # 2. Get or create candidate (Deduplication by email)
        candidate = await CandidateService.get_or_create_candidate(
            db, company_id=company_id, email=email, full_name=full_name, phone=phone
        )

        # 3. Parse CV if file provided
        raw_text = raw_text_input or ""
        if file_bytes and filename:
            extracted_text, parsed_schema = await CVParser.parse_and_structure_cv(file_bytes, filename)
            raw_text = extracted_text
            candidate.raw_text = raw_text
            candidate.parsed_data = parsed_schema.model_dump()
            candidate.cv_file_url = f"/storage/cvs/{candidate.id}_{filename}"

        # 4. Generate candidate embedding for talent search
        if raw_text:
            vector = await embedding_client.get_embedding(raw_text[:2000])
            candidate.embedding = vector

        # 5. Create or get existing Application for this job
        app_result = await db.execute(
            select(Application).where(
                Application.job_posting_id == job_id, Application.candidate_id == candidate.id
            )
        )
        application = app_result.scalars().first()
        if not application:
            application = Application(
                job_posting_id=job_id,
                candidate_id=candidate.id,
                status="new",
            )
            db.add(application)
            await db.flush()

        # 6. Score CV with AI against JD
        llm = get_llm_client()
        criteria_weights = job.ai_criteria_weights or {
            "required_skills": 0.4,
            "experience_years": 0.3,
            "education": 0.15,
            "domain_knowledge": 0.15,
        }
        match_analysis = await llm.match_cv(
            job_title=job.title,
            department=job.department or "",
            job_description=job.description,
            job_requirements=job.requirements,
            criteria_weights=criteria_weights,
            candidate_name=candidate.full_name,
            cv_content=raw_text or str(candidate.parsed_data),
        )

        application.match_score = match_analysis.overall_score
        application.score_breakdown = match_analysis.model_dump()

        await db.commit()
        await db.refresh(application)
        return application

    @staticmethod
    async def get_candidate(db: AsyncSession, candidate_id: str, company_id: str) -> Candidate:
        result = await db.execute(
            select(Candidate)
            .options(selectinload(Candidate.applications))
            .where(Candidate.id == candidate_id, Candidate.company_id == company_id)
        )
        candidate = result.scalars().first()
        if not candidate:
            raise NotFoundException("Candidate", candidate_id)
        return candidate

    @staticmethod
    async def list_candidates(
        db: AsyncSession,
        company_id: str,
        job_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Candidate]:
        query = (
            select(Candidate)
            .options(selectinload(Candidate.applications))
            .where(Candidate.company_id == company_id)
        )
        if job_id:
            query = query.join(Candidate.applications).where(Application.job_posting_id == job_id)
            if status:
                query = query.where(Application.status == status)
        query = query.offset(skip).limit(limit).order_by(Candidate.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_pipeline_status(
        db: AsyncSession, application_id: str, data: PipelineStatusUpdate
    ) -> Application:
        result = await db.execute(select(Application).where(Application.id == application_id))
        app = result.scalars().first()
        if not app:
            raise NotFoundException("Application", application_id)

        valid_statuses = [
            "new",
            "reviewing",
            "interview_invited",
            "interviewed",
            "offered",
            "hired",
            "rejected",
            "talent_pool",
        ]
        if data.status not in valid_statuses:
            raise BadRequestException(f"Invalid status '{data.status}'. Allowed: {valid_statuses}")

        app.status = data.status
        if data.hr_notes:
            app.hr_notes = data.hr_notes
        await db.commit()
        await db.refresh(app)
        return app

    @staticmethod
    async def submit_hr_feedback(
        db: AsyncSession, application_id: str, feedback: HRFeedbackCreate
    ) -> Application:
        result = await db.execute(select(Application).where(Application.id == application_id))
        app = result.scalars().first()
        if not app:
            raise NotFoundException("Application", application_id)

        app.hr_feedback = feedback.model_dump()
        await db.commit()
        await db.refresh(app)
        return app

    @staticmethod
    async def search_talent_pool(
        db: AsyncSession, company_id: str, query: TalentPoolSearchQuery
    ) -> List[Candidate]:
        sql = select(Candidate).options(selectinload(Candidate.applications)).where(Candidate.company_id == company_id)
        if query.min_rating is not None:
            sql = sql.where(Candidate.rating >= query.min_rating)
        result = await db.execute(sql)
        candidates = result.scalars().all()
        return candidates
