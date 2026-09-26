import re
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.modules.job_posting.models import JobPosting
from app.modules.job_posting.schemas import JobPostingCreate, JobPostingUpdate
from app.shared.exceptions import NotFoundException, BadRequestException


def generate_slug(title: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    timestamp = int(datetime.now(timezone.utc).timestamp())
    return f"{slug}-{timestamp}"


class JobPostingService:
    @staticmethod
    async def create_job(db: AsyncSession, company_id: str, user_id: str, data: JobPostingCreate) -> JobPosting:
        slug = generate_slug(data.title)
        job = JobPosting(
            company_id=company_id,
            created_by_id=user_id,
            title=data.title,
            slug=slug,
            department=data.department,
            location=data.location,
            salary_range=data.salary_range,
            description=data.description,
            requirements=data.requirements,
            ai_criteria_weights=data.ai_criteria_weights or {},
            deadline=data.deadline,
            status="draft",
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def get_job_by_id(db: AsyncSession, job_id: str, company_id: Optional[str] = None) -> JobPosting:
        query = select(JobPosting).where(JobPosting.id == job_id)
        if company_id:
            query = query.where(JobPosting.company_id == company_id)
        result = await db.execute(query)
        job = result.scalars().first()
        if not job:
            raise NotFoundException("JobPosting", job_id)
        
        # Auto-close check if expired
        if job.status == "published" and job.deadline and job.deadline < datetime.now(timezone.utc):
            job.status = "closed"
            await db.commit()
            await db.refresh(job)

        return job

    @staticmethod
    async def get_job_by_slug(db: AsyncSession, slug: str) -> JobPosting:
        result = await db.execute(select(JobPosting).where(JobPosting.slug == slug))
        job = result.scalars().first()
        if not job or job.status != "published":
            raise NotFoundException("Public JobPosting", slug)
        return job

    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        company_id: str,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[JobPosting]:
        query = select(JobPosting).where(JobPosting.company_id == company_id)
        if status:
            query = query.where(JobPosting.status == status)
        query = query.offset(skip).limit(limit).order_by(JobPosting.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_job(
        db: AsyncSession, job_id: str, company_id: str, data: JobPostingUpdate
    ) -> JobPosting:
        job = await JobPostingService.get_job_by_id(db, job_id, company_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(job, key, value)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def change_status(
        db: AsyncSession, job_id: str, company_id: str, new_status: str
    ) -> JobPosting:
        allowed = ["draft", "pending_approval", "published", "paused", "closed"]
        if new_status not in allowed:
            raise BadRequestException(f"Invalid status '{new_status}'. Allowed: {allowed}")
        job = await JobPostingService.get_job_by_id(db, job_id, company_id)
        job.status = new_status
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def list_public_jobs(db: AsyncSession, skip: int = 0, limit: int = 20) -> List[JobPosting]:
        query = (
            select(JobPosting)
            .where(JobPosting.status == "published")
            .offset(skip)
            .limit(limit)
            .order_by(JobPosting.created_at.desc())
        )
        result = await db.execute(query)
        return result.scalars().all()
