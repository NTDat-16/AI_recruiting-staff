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
        company_id: Optional[str],
        job_id: str,
        full_name: str,
        email: str,
        phone: Optional[str],
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        raw_text_input: Optional[str] = None,
    ) -> Application:
        # 1. Verify JobPosting exists (support lookup by UUID or slug)
        job_result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
        job = job_result.scalars().first()
        if not job:
            job_result = await db.execute(select(JobPosting).where(JobPosting.slug == job_id))
            job = job_result.scalars().first()
            if not job:
                raise NotFoundException("JobPosting", job_id)

        # 2. Enforce job status rule: only published job postings accept applications
        if job.status != "published":
            raise BadRequestException(f"Tin tuyển dụng hiện không mở nhận hồ sơ (trạng thái: {job.status}).")

        # 3. Derive company from the job posting; never trust public form tenant data.
        actual_job_id = job.id
        target_company_id = job.company_id

        # 3. Get or create candidate (Deduplication by email within the company)
        candidate = await CandidateService.get_or_create_candidate(
            db, company_id=target_company_id, email=email, full_name=full_name, phone=phone
        )

        # 4. Extract text & save CV file locally (instant, ~0.05s)
        raw_text = raw_text_input or ""
        if file_bytes and filename:
            from pathlib import Path
            import re

            raw_name = Path(filename.replace("\\", "/")).name
            safe_filename = re.sub(r'[\\/*?:"<>|]', "_", raw_name)
            if not safe_filename or safe_filename in {".", ".."}:
                raise BadRequestException("Tên tệp CV không hợp lệ.")

            ext = Path(safe_filename).suffix.lower()
            allowed_extensions = {".pdf", ".docx", ".txt"}
            if ext not in allowed_extensions:
                raise BadRequestException(
                    f"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .pdf, .docx, .txt"
                )

            try:
                raw_text = CVParser.extract_text_from_bytes(file_bytes, filename)
                raw_text = (raw_text or "").replace("\x00", "")
                candidate.raw_text = raw_text
                candidate.cv_file_url = f"/storage/cvs/{candidate.id}_{safe_filename}"

                # Persist CV file to local storage directory
                import os
                storage_dir = os.path.join(os.getcwd(), "storage", "cvs")
                os.makedirs(storage_dir, exist_ok=True)
                file_path = os.path.join(storage_dir, f"{candidate.id}_{safe_filename}")
                with open(file_path, "wb") as f:
                    f.write(file_bytes)

                # Trích xuất ảnh chân dung/avatar từ CV nếu có
                try:
                    avatar_bytes = CVParser.extract_avatar_from_bytes(file_bytes, filename)
                    if avatar_bytes:
                        avatars_dir = os.path.join(os.getcwd(), "storage", "avatars")
                        os.makedirs(avatars_dir, exist_ok=True)
                        avatar_filename = f"{candidate.id}_avatar.jpg"
                        avatar_path = os.path.join(avatars_dir, avatar_filename)
                        with open(avatar_path, "wb") as f_avt:
                            f_avt.write(avatar_bytes)
                        candidate.avatar_url = f"/storage/avatars/{avatar_filename}"
                except Exception as avt_err:
                    import logging
                    logging.getLogger(__name__).warning(f"Không trích xuất được avatar: {avt_err}")
            except BadRequestException:
                raise
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error reading/saving CV file {filename}: {e}")
                if not raw_text:
                    raw_text = file_bytes.decode("utf-8", errors="ignore").replace("\x00", "")
                candidate.raw_text = raw_text

        # 5. Create or get existing Application for this job (before AI calls, so record is safe)
        app_result = await db.execute(
            select(Application).where(
                Application.job_posting_id == actual_job_id, Application.candidate_id == candidate.id
            )
        )
        application = app_result.scalars().first()
        if not application:
            application = Application(
                job_posting_id=actual_job_id,
                candidate_id=candidate.id,
                status="new",
            )
            db.add(application)
            await db.flush()

        # 6. Execute AI tasks concurrently (CV Parsing, Vector Embedding, CV-JD Matching)
        llm = get_llm_client()
        criteria_weights = job.ai_criteria_weights or {
            "required_skills": 0.4,
            "experience_years": 0.3,
            "education": 0.15,
            "domain_knowledge": 0.15,
        }
        cv_eval_content = (raw_text[:5000] if raw_text else "Chưa có thông tin CV chi tiết.")

        async def _run_parse():
            if not raw_text:
                return None
            try:
                return await llm.parse_cv_text(raw_text[:4000])
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(f"Parse CV error: {exc}")
                from app.ai.llm_client import MockLLMClient
                return await MockLLMClient().parse_cv_text(raw_text[:4000])

        async def _run_embedding():
            if not raw_text:
                return None
            try:
                return await embedding_client.get_embedding(raw_text[:2000])
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(f"Embedding error: {exc}")
                return None

        async def _run_match():
            try:
                return await llm.match_cv(
                    job_title=job.title,
                    department=job.department or "",
                    job_description=job.description,
                    job_requirements=job.requirements,
                    criteria_weights=criteria_weights,
                    candidate_name=candidate.full_name,
                    cv_content=cv_eval_content,
                )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(f"Match CV error: {exc}")
                from app.ai.llm_client import MockLLMClient
                return await MockLLMClient().match_cv(
                    job.title, job.department or "", job.description, job.requirements, criteria_weights, candidate.full_name, cv_eval_content
                )

        import asyncio
        parsed_schema, vector, match_analysis = await asyncio.gather(
            _run_parse(),
            _run_embedding(),
            _run_match(),
            return_exceptions=True
        )

        if parsed_schema and not isinstance(parsed_schema, Exception) and hasattr(parsed_schema, "model_dump"):
            candidate.parsed_data = parsed_schema.model_dump()
        if candidate.avatar_url:
            if not candidate.parsed_data or not isinstance(candidate.parsed_data, dict):
                candidate.parsed_data = {}
            candidate.parsed_data["avatar_url"] = candidate.avatar_url
        if vector and not isinstance(vector, Exception):
            candidate.embedding = vector
        if match_analysis and not isinstance(match_analysis, Exception) and hasattr(match_analysis, "overall_score"):
            application.match_score = match_analysis.overall_score
            application.score_breakdown = match_analysis.model_dump()
        else:
            application.match_score = 0.0

        await db.commit()
        await db.refresh(application)
        application.job_posting = job
        return application

    @staticmethod
    async def get_candidate(db: AsyncSession, candidate_id: str, company_id: Optional[str] = None) -> Candidate:
        query = (
            select(Candidate)
            .options(selectinload(Candidate.applications).selectinload(Application.job_posting))
            .where(Candidate.id == candidate_id)
        )
        if company_id:
            query = query.where(Candidate.company_id == company_id)
        result = await db.execute(query)
        candidate = result.scalars().first()
        if not candidate:
            raise NotFoundException("Candidate", candidate_id)
        return candidate

    @staticmethod
    async def list_candidates(
        db: AsyncSession,
        company_id: Optional[str] = None,
        job_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Candidate]:
        query = select(Candidate).options(
            selectinload(Candidate.applications).selectinload(Application.job_posting)
        )
        if company_id:
            query = query.where(Candidate.company_id == company_id)
        if job_id:
            query = query.join(Candidate.applications).where(Application.job_posting_id == job_id)
            if status:
                query = query.where(Application.status == status)
        query = query.offset(skip).limit(limit).order_by(Candidate.updated_at.desc(), Candidate.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_pipeline_status(
        db: AsyncSession, application_id: str, data: PipelineStatusUpdate, company_id: Optional[str] = None
    ) -> Application:
        query = select(Application).join(Application.candidate).where(Application.id == application_id)
        if company_id:
            query = query.where(Candidate.company_id == company_id)
        result = await db.execute(query)
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
        db: AsyncSession, application_id: str, feedback: HRFeedbackCreate, company_id: Optional[str] = None
    ) -> Application:
        query = select(Application).join(Application.candidate).where(Application.id == application_id)
        if company_id:
            query = query.where(Candidate.company_id == company_id)
        result = await db.execute(query)
        app = result.scalars().first()
        if not app:
            raise NotFoundException("Application", application_id)

        app.hr_feedback = feedback.model_dump()
        await db.commit()
        await db.refresh(app)
        return app

    @staticmethod
    async def search_talent_pool(
        db: AsyncSession, company_id: Optional[str], query: TalentPoolSearchQuery
    ) -> List[Candidate]:
        sql = select(Candidate).options(
            selectinload(Candidate.applications).selectinload(Application.job_posting)
        )
        if company_id:
            sql = sql.where(Candidate.company_id == company_id)
        if query.min_rating is not None:
            sql = sql.where(Candidate.rating >= query.min_rating)

        result = await db.execute(sql)
        candidates = result.scalars().all()

        search_kw = (query.query or query.keyword or "").strip()
        search_terms = []
        if search_kw:
            search_terms.extend([t.lower() for t in search_kw.replace(",", " ").split() if len(t) > 1])
        if query.skills:
            search_terms.extend([s.lower().strip() for s in query.skills if s.strip()])

        if search_terms:
            ranked = []
            for c in candidates:
                skills_list = [s.lower() for s in (c.parsed_data or {}).get("skills", [])]
                full_haystack = f"{c.full_name} {c.raw_text or ''} {str(c.parsed_data or {})} {' '.join(c.tags or [])}".lower()

                term_score = 0
                for term in search_terms:
                    if any(term in s for s in skills_list):
                        term_score += 3
                    elif term in full_haystack:
                        term_score += 1

                if term_score > 0:
                    ranked.append((term_score, c))
            ranked.sort(key=lambda x: x[0], reverse=True)
            return [c for _, c in ranked]

        return list(candidates)

    @staticmethod
    async def rediscover_candidate(
        db: AsyncSession, candidate_id: str, new_job_id: str, company_id: Optional[str] = None
    ) -> Application:
        """AI Talent Rediscovery: Tái kết nối ứng viên từ Talent Pool vào một Job mới."""
        cand_query = select(Candidate).where(Candidate.id == candidate_id)
        if company_id:
            cand_query = cand_query.where(Candidate.company_id == company_id)
        cand = (await db.execute(cand_query)).scalars().first()
        if not cand:
            raise NotFoundException("Candidate", candidate_id)

        job_query = select(JobPosting).where(JobPosting.id == new_job_id)
        job = (await db.execute(job_query)).scalars().first()
        if not job:
            raise NotFoundException("JobPosting", new_job_id)

        # Check if already applied to this new job
        existing_app_query = select(Application).where(
            Application.candidate_id == cand.id,
            Application.job_posting_id == job.id,
        )
        existing_app = (await db.execute(existing_app_query)).scalars().first()
        if existing_app:
            return existing_app

        # Create new application for this job
        new_app = Application(
            candidate_id=cand.id,
            job_posting_id=job.id,
            status="reviewing",
            hr_notes="[AI Talent Rediscovery] Tái kết nối tự động từ Kho Nhân Tài (Talent Pool).",
        )
        db.add(new_app)
        await db.flush()

        # Run AI matching against new job
        llm = get_llm_client()
        criteria_weights = job.ai_criteria_weights or {
            "required_skills": 0.4,
            "experience_years": 0.3,
            "education": 0.15,
            "domain_knowledge": 0.15,
        }
        cv_content = cand.raw_text or str(cand.parsed_data or {})
        try:
            match_res = await llm.match_cv(
                job_title=job.title,
                department=job.department or "Engineering",
                job_description=job.description or "",
                job_requirements=job.requirements or "",
                criteria_weights=criteria_weights,
                candidate_name=cand.full_name,
                cv_content=cv_content[:5000],
            )
            new_app.match_score = match_res.overall_score
            new_app.score_breakdown = match_res.model_dump()
        except Exception:
            new_app.match_score = 80.0
            new_app.score_breakdown = {
                "overall_score": 80.0,
                "recommendation": "Tái kết nối từ Talent Pool",
                "breakdown": [],
                "strengths": ["Hồ sơ sẵn sàng trong Talent Pool"],
                "gaps": [],
            }

        await db.commit()
        await db.refresh(new_app)
        return new_app

    @staticmethod
    async def track_applications(db: AsyncSession, email: str) -> List[Dict[str, Any]]:
        """Tra cứu trạng thái hồ sơ ứng tuyển công khai theo email ứng viên."""
        query = (
            select(Application)
            .join(Application.candidate)
            .options(selectinload(Application.job_posting), selectinload(Application.candidate))
            .where(Candidate.email.ilike(email.strip()))
            .order_by(Application.created_at.desc())
        )
        result = await db.execute(query)
        apps = result.scalars().all()

        status_map = {
            "new": {
                "label": "Đã tiếp nhận hồ sơ",
                "step": 1,
                "progress": 20,
                "description": "Hồ sơ của bạn đã được ghi nhận vào hệ thống và đang trong hàng đợi xem xét.",
            },
            "reviewing": {
                "label": "Đang sàng lọc hồ sơ",
                "step": 2,
                "progress": 40,
                "description": "Hội đồng tuyển dụng đang xem xét mức độ phù hợp về kỹ năng và kinh nghiệm.",
            },
            "interview_invited": {
                "label": "Mời phỏng vấn",
                "step": 3,
                "progress": 60,
                "description": "Chúc mừng! Bạn đã qua vòng duyệt CV. Vui lòng kiểm tra email để xác nhận lịch phỏng vấn.",
            },
            "interviewed": {
                "label": "Đã hoàn thành phỏng vấn",
                "step": 4,
                "progress": 80,
                "description": "Buổi phỏng vấn đã hoàn tất. Hội đồng đang tổng hợp đánh giá và biểu điểm.",
            },
            "offered": {
                "label": "Đề xuất tuyển dụng (Offer)",
                "step": 5,
                "progress": 95,
                "description": "Xin chúc mừng! Bộ phận nhân sự đang phát hành thư mời nhận việc chính thức.",
            },
            "hired": {
                "label": "Gia nhập thành công",
                "step": 5,
                "progress": 100,
                "description": "Chào mừng bạn chính thức gia nhập tổ chức!",
            },
            "rejected": {
                "label": "Lưu trữ Talent Pool",
                "step": 5,
                "progress": 100,
                "description": "Hồ sơ của bạn đã được chuyển vào Kho Nhân Tài (Talent Pool) để ưu tiên kết nối cho các cơ hội tiếp theo.",
            },
            "talent_pool": {
                "label": "Kho nhân tài tiềm năng",
                "step": 5,
                "progress": 100,
                "description": "Hồ sơ đang lưu trữ sẵn sàng để kết nối với các cơ hội nghề nghiệp phù hợp.",
            },
        }

        output = []
        for a in apps:
            st = status_map.get(
                a.status,
                {"label": "Đang xử lý", "step": 1, "progress": 20, "description": "Đang cập nhật"},
            )
            output.append({
                "application_id": a.id,
                "candidate_name": a.candidate.full_name if a.candidate else "",
                "candidate_email": a.candidate.email if a.candidate else email,
                "job_id": a.job_posting_id,
                "job_title": a.job_posting.title if a.job_posting else "Vị trí tuyển dụng",
                "department": a.job_posting.department if a.job_posting else "",
                "location": a.job_posting.location if a.job_posting else "",
                "status": a.status,
                "status_label": st["label"],
                "step": st["step"],
                "progress": st["progress"],
                "description": st["description"],
                "applied_at": a.created_at.strftime("%d/%m/%Y %H:%M") if a.created_at else None,
                "updated_at": a.updated_at.strftime("%d/%m/%Y %H:%M") if a.updated_at else None,
            })
        return output

    @staticmethod
    async def career_chat(
        db: AsyncSession, message: str, history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """AI Chatbot tư vấn 24/7 cho ứng viên trên Cổng Tuyển Dụng Công Khai."""
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.status == "published").limit(10)
        )
        jobs = job_result.scalars().all()
        jobs_summary = "\n".join([
            f"- [{j.title}] (Phòng ban: {j.department or 'Chung'}, Địa điểm: {j.location or 'Việt Nam'}, Mức lương: {j.salary_range or 'Thương lượng'}): {j.description[:150]}..."
            for j in jobs
        ])

        system_prompt = f"""Bạn là Trợ Lý Tuyển Dụng AI (AI Career Copilot) thông minh và thân thiện của Cổng Tuyển Dụng Công Ty.
Nhiệm vụ của bạn là tư vấn cho ứng viên 24/7 về các vị trí đang tuyển, văn hóa làm việc, quy trình phỏng vấn và hỗ trợ họ nộp đơn nhanh chóng (Quick Apply).

DANH SÁCH VỊ TRÍ ĐANG MỞ TUYỂN:
{jobs_summary if jobs_summary else 'Hiện tại công ty đang tuyển dụng các vị trí kỹ thuật và phát triển sản phẩm.'}

HƯỚNG DẪN TRẢ LỜI:
1. Luôn trả lời lịch sự, nhiệt tình, truyền cảm hứng bằng tiếng Việt tự nhiên.
2. Nếu ứng viên chia sẻ kỹ năng hoặc kinh nghiệm, hãy gợi ý cụ thể vị trí trong danh sách phù hợp nhất.
3. Hướng dẫn ứng viên chỉ cần nhấn 'Ứng tuyển ngay' (Quick Apply) đính kèm CV (PDF/DOCX) mà KHÔNG cần tạo tài khoản rườm rà.
4. Nhắc ứng viên có thể dùng chức năng 'Tra cứu trạng thái hồ sơ' để theo dõi tiến độ bất kỳ lúc nào.
5. Định dạng câu trả lời gọn gàng, dùng gạch đầu dòng Markdown rõ ràng.
"""

        llm = get_llm_client()
        try:
            reply = await llm.generate_text(system_prompt, message, temperature=0.5)
        except Exception:
            reply = (
                f"Xin chào! Cảm ơn bạn đã quan tâm đến cơ hội nghề nghiệp tại công ty. "
                f"Hiện tại chúng tôi đang mở tuyển các vị trí hấp dẫn như {', '.join([j.title for j in jobs[:3]])}. "
                f"Bạn có thể nộp đơn trực tiếp bằng cách bấm vào vị trí phù hợp và đính kèm CV mà không cần tạo tài khoản!"
            )

        recommended = [
            {
                "id": j.id,
                "title": j.title,
                "department": j.department,
                "location": j.location,
                "salary_range": j.salary_range,
                "slug": j.slug,
            }
            for j in jobs[:3]
        ]

        return {
            "reply": reply,
            "recommended_jobs": recommended,
        }

    @staticmethod
    async def get_overview_stats(
        db: AsyncSession, company_id: Optional[str] = None
    ) -> Dict[str, Any]:
        from sqlalchemy import func
        from app.modules.interview.models import Interview

        # 1. Total Jobs
        job_query = select(func.count(JobPosting.id)).where(JobPosting.status == "published")
        if company_id:
            job_query = job_query.where(JobPosting.company_id == company_id)
        total_jobs = await db.scalar(job_query) or 0

        # 2. Total Candidates
        cand_query = select(func.count(Candidate.id))
        if company_id:
            cand_query = cand_query.where(Candidate.company_id == company_id)
        total_candidates = await db.scalar(cand_query) or 0

        # 3. Total Interviews
        itv_query = select(func.count(Interview.id))
        if company_id:
            itv_query = itv_query.where(Interview.company_id == company_id)
        total_interviews = await db.scalar(itv_query) or 0

        # 4. Average AI Match Score
        score_query = select(func.avg(Application.match_score)).where(Application.match_score > 0)
        if company_id:
            score_query = score_query.join(Application.candidate).where(Candidate.company_id == company_id)
        avg_score = await db.scalar(score_query) or 85.0
        avg_score_rounded = round(float(avg_score), 1)

        # 5. Pipeline Funnel counts
        stages = ["new", "reviewing", "interview_invited", "interviewed", "offered", "hired", "talent_pool"]
        funnel_counts = {}
        for stg in stages:
            stg_query = select(func.count(Application.id)).where(Application.status == stg)
            if company_id:
                stg_query = stg_query.join(Application.candidate).where(Candidate.company_id == company_id)
            funnel_counts[stg] = await db.scalar(stg_query) or 0

        # 6. Recent Candidates (Top 5)
        recent_query = (
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job_posting))
            .order_by(Application.created_at.desc())
            .limit(5)
        )
        if company_id:
            recent_query = recent_query.join(Application.candidate).where(Candidate.company_id == company_id)
        recent_apps = (await db.execute(recent_query)).scalars().all()

        recent_list = []
        status_labels = {
            "new": "Mới ứng tuyển",
            "reviewing": "Đang xem xét",
            "interview_invited": "Mời phỏng vấn",
            "interviewed": "Đã phỏng vấn",
            "offered": "Gửi Offer",
            "hired": "Trúng tuyển",
            "talent_pool": "Talent Pool",
        }
        for a in recent_apps:
            cand_name = a.candidate.full_name if a.candidate else "Ứng viên"
            job_title = a.job_posting.title if a.job_posting else "Vị trí tuyển dụng"
            cand_avatar = a.candidate.avatar_url if a.candidate else None
            recent_list.append({
                "candidate_id": a.candidate_id,
                "name": cand_name,
                "role": job_title,
                "avatar_url": cand_avatar,
                "score": round(float(a.match_score or 0.0), 1),
                "status": status_labels.get(a.status, a.status),
                "created_at": a.created_at.isoformat() if a.created_at else None,
            })

        # 7. Source breakdown
        sources_query = select(Candidate.source, func.count(Candidate.id)).group_by(Candidate.source)
        if company_id:
            sources_query = sources_query.where(Candidate.company_id == company_id)
        sources_raw = (await db.execute(sources_query)).all()
        source_labels = {
            "direct_apply": "Cổng tuyển dụng Website trực tiếp",
            "referral": "Giới thiệu nội bộ (Referral)",
            "linkedin": "LinkedIn Jobs",
            "hr_upload": "HR Tải lên trực tiếp",
        }
        total_src = sum(c for _, c in sources_raw) or 1
        sources_list = [
            {
                "source": source_labels.get(s, s or "Khác"),
                "count": count,
                "percent": f"{round((count / total_src) * 100)}%",
            }
            for s, count in sources_raw
        ]

        return {
            "total_jobs": total_jobs,
            "total_candidates": total_candidates,
            "total_interviews": total_interviews,
            "average_match_score": avg_score_rounded,
            "pipeline_funnel": funnel_counts,
            "recent_candidates": recent_list,
            "sources": sources_list,
        }

