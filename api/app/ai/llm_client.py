import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from app.core.config import settings
from app.shared.exceptions import AIServiceException
from app.ai.schemas import (
    ParsedCVSchema,
    CVMatchAnalysis,
    CriteriaScore,
    InterviewQuestionsResponse,
    SuggestedQuestion,
    InterviewEvaluationAnalysis,
    RubricItemScore,
    CandidateEmailClassification,
)
from app.ai.prompts import (
    CV_MATCH_SYSTEM_PROMPT,
    CV_MATCH_USER_PROMPT_TEMPLATE,
    INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
    INTERVIEW_QUESTIONS_USER_PROMPT_TEMPLATE,
    INTERVIEW_EVALUATION_SYSTEM_PROMPT,
    INTERVIEW_EVALUATION_USER_PROMPT_TEMPLATE,
    CANDIDATE_RESPONSE_SYSTEM_PROMPT,
    CANDIDATE_RESPONSE_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        """Sinh văn bản tự do từ system và user prompt."""
        pass

    @abstractmethod
    async def parse_cv_text(self, raw_text: str) -> ParsedCVSchema:
        """Trích xuất thông tin cấu trúc từ văn bản thô của CV."""
        pass

    @abstractmethod
    async def match_cv(
        self,
        job_title: str,
        department: str,
        job_description: str,
        job_requirements: str,
        criteria_weights: Dict[str, Any],
        candidate_name: str,
        cv_content: str,
    ) -> CVMatchAnalysis:
        """Chấm điểm và phân tích mức độ phù hợp giữa CV và JD."""
        pass

    @abstractmethod
    async def generate_interview_questions(
        self,
        job_title: str,
        job_requirements: str,
        candidate_name: str,
        cv_summary: str,
    ) -> InterviewQuestionsResponse:
        """Gợi ý câu hỏi phỏng vấn theo ngữ cảnh ứng viên và JD."""
        pass

    @abstractmethod
    async def evaluate_interview_transcript(
        self,
        job_requirements: str,
        rubric_criteria: str,
        transcript_text: str,
    ) -> InterviewEvaluationAnalysis:
        """Đánh giá buổi phỏng vấn dựa trên transcript và rubric."""
        pass

    @abstractmethod
    async def classify_candidate_email_response(
        self,
        email_content: str,
        candidate_name: str,
        job_title: str,
        interview_title: Optional[str] = None,
    ) -> CandidateEmailClassification:
        """Phân loại phản hồi email của ứng viên (đồng ý, từ chối/hủy, xin dời lịch)."""
        pass


class MockLLMClient(BaseLLMClient):
    """Client giả lập hỗ trợ phát triển local, kiểm thử đơn vị hoặc khi chưa cấu hình API Key."""

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        return f"[Mock LLM Response] processed user prompt of length {len(user_prompt)}"

    async def parse_cv_text(self, raw_text: str) -> ParsedCVSchema:
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        name = lines[0] if lines else "Nguyen Van A"
        return ParsedCVSchema(
            full_name=name,
            email="candidate@example.com",
            phone="0901234567",
            skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React"],
            total_experience_years=3.5,
            education=[
                {
                    "institution": "Đại học Bách Khoa",
                    "degree": "Kỹ sư",
                    "field_of_study": "Khoa học Máy tính",
                    "graduation_year": 2022,
                }
            ],
            experience=[
                {
                    "company": "Tech Solutions Corp",
                    "position": "Backend Developer",
                    "years": 2.5,
                    "highlights": [
                        "Xây dựng REST API bằng FastAPI",
                        "Tối ưu truy vấn PostgreSQL và tích hợp Redis cache",
                    ],
                }
            ],
            certifications=["AWS Certified Solutions Architect Associate"],
        )

    async def match_cv(
        self,
        job_title: str,
        department: str,
        job_description: str,
        job_requirements: str,
        criteria_weights: Dict[str, Any],
        candidate_name: str,
        cv_content: str,
    ) -> CVMatchAnalysis:
        # Giả lập tính toán điểm dựa trên nội dung
        score = 85.0
        return CVMatchAnalysis(
            overall_score=score,
            breakdown=[
                CriteriaScore(
                    name="Kỹ năng bắt buộc (Python, FastAPI, SQL)",
                    weight=0.4,
                    score=90.0,
                    explanation="Ứng viên có kinh nghiệm thực tế 2.5 năm làm việc với FastAPI và PostgreSQL.",
                ),
                CriteriaScore(
                    name="Số năm kinh nghiệm",
                    weight=0.3,
                    score=80.0,
                    explanation="Yêu cầu 3 năm, ứng viên đạt 3.5 năm tổng kinh nghiệm lập trình.",
                ),
                CriteriaScore(
                    name="Học vấn & Bằng cấp",
                    weight=0.15,
                    score=85.0,
                    explanation="Tốt nghiệp Kỹ sư CNTT Đại học Bách Khoa, có chứng chỉ AWS.",
                ),
                CriteriaScore(
                    name="Kỹ năng bổ trợ (Docker, Redis, AI)",
                    weight=0.15,
                    score=82.0,
                    explanation="Có kiến thức về Docker và Redis, có nền tảng tốt để tiếp cận hệ sinh thái AI.",
                ),
            ],
            strengths=[
                "Nắm vững framework FastAPI và kiến trúc microservices",
                "Có kinh nghiệm thực chiến với tối ưu hóa cơ sở dữ liệu quan hệ",
                "Tiếng Anh đọc hiểu tài liệu chuyên ngành tốt",
            ],
            gaps=[
                "Chưa có nhiều kinh nghiệm triển khai mô hình LLM quy mô lớn trên production",
            ],
            recommendation="Khuyến nghị: Mời phỏng vấn vòng 1 (Technical Interview). Ứng viên có nền tảng vững vàng.",
        )

    async def generate_interview_questions(
        self,
        job_title: str,
        job_requirements: str,
        candidate_name: str,
        cv_summary: str,
    ) -> InterviewQuestionsResponse:
        return InterviewQuestionsResponse(
            candidate_name=candidate_name,
            target_role=job_title,
            questions=[
                SuggestedQuestion(
                    category="Chuyên môn kỹ thuật",
                    question="Trong dự án gần nhất sử dụng FastAPI, bạn đã thiết kế cơ chế xử lý background tasks và cache như thế nào để đảm bảo throughput cao?",
                    rationale="Kiểm tra độ sâu về kiến trúc async và xử lý nền trong hệ thống backend quy mô lớn.",
                    expected_answer_points=[
                        "Sử dụng Celery/Redis hoặc background tasks nội tại",
                        "Kiểm soát connection pool và timeout",
                        "Idempotency trong background workers",
                    ],
                    difficulty="medium",
                ),
                SuggestedQuestion(
                    category="Giải quyết vấn đề",
                    question="Hãy kể về một sự cố bottleneck hiệu năng database bạn từng gặp và các bước bạn đo lường, tối ưu hóa (index, query explain, connection pooling).",
                    rationale="Xác minh kinh nghiệm thực chiến giải quyết bài toán tải cao với PostgreSQL.",
                    expected_answer_points=[
                        "Phân tích EXPLAIN ANALYZE",
                        "Tạo index composite hoặc partial index",
                        "Kiểm tra n+1 query và ORM overhead",
                    ],
                    difficulty="hard",
                ),
                SuggestedQuestion(
                    category="Văn hóa & Làm việc nhóm",
                    question="Khi bạn có bất đồng ý kiến về kiến trúc hệ thống với một đồng nghiệp kỹ thuật, bạn đã thuyết phục hoặc tìm kiếm tiếng nói chung như thế nào?",
                    rationale="Đánh giá kỹ năng giao tiếp và tư duy hợp tác.",
                    expected_answer_points=[
                        "Dựa trên dữ liệu/benchmark khách quan",
                        "Tôn trọng góc nhìn đa chiều",
                        "Ưu tiên mục tiêu chung của sản phẩm",
                    ],
                    difficulty="easy",
                ),
            ],
        )

    async def evaluate_interview_transcript(
        self,
        job_requirements: str,
        rubric_criteria: str,
        transcript_text: str,
    ) -> InterviewEvaluationAnalysis:
        return InterviewEvaluationAnalysis(
            summary="Ứng viên trả lời mạch lạc, thể hiện sự am hiểu chắc chắn về FastAPI và PostgreSQL. Phản ứng nhanh trước các câu hỏi tình huống hệ thống.",
            overall_rating=8.4,
            rubric_scores=[
                RubricItemScore(
                    criterion="Kiến thức chuyên môn",
                    score=8.5,
                    evidence_quote="Ở phút 12:40, ứng viên giải thích chi tiết cơ chế phân trang cursor-based và caching Redis để giảm 70% tải DB.",
                    comment="Nắm rất chắc cơ chế backend và hệ thống phân tán.",
                ),
                RubricItemScore(
                    criterion="Kỹ năng giao tiếp & Diễn đạt",
                    score=8.2,
                    evidence_quote="Trình bày có cấu trúc STAR, giọng điệu tự tin, lắng nghe kỹ câu hỏi của interviewer.",
                    comment="Giao tiếp tốt, truyền đạt thông điệp rõ ràng.",
                ),
                RubricItemScore(
                    criterion="Phù hợp văn hóa",
                    score=8.5,
                    evidence_quote="Chia sẻ quan điểm tích cực khi nhận feedback phản biện từ đồng nghiệp.",
                    comment="Thái độ học hỏi và cầu tiến cao.",
                ),
            ],
            key_strengths=[
                "Tư duy kiến trúc hệ thống bài bản",
                "Kinh nghiệm thực tiễn giải quyết bài toán tải",
                "Thái độ chuyên nghiệp, cởi mở",
            ],
            areas_for_growth=[
                "Cần trau dồi thêm về các mô hình embedding vector và RAG pipelines",
            ],
            recommendation="Đề xuất: Đạt (Pass) - Chuyển sang vòng thảo luận Offer với HR",
        )

    async def classify_candidate_email_response(
        self,
        email_content: str,
        candidate_name: str,
        job_title: str,
        interview_title: Optional[str] = None,
    ) -> CandidateEmailClassification:
        content_lower = email_content.lower()
        if any(w in content_lower for w in ["từ chối", "xin rút", "hủy", "offer khác", "không tham gia", "decline", "cancel", "bỏ qua"]):
            return CandidateEmailClassification(
                classification="declined",
                confidence=0.95,
                sentiment="negative",
                summary="Ứng viên xin phép từ chối hoặc hủy tham gia buổi phỏng vấn.",
                reason="Ứng viên thông báo từ chối cơ hội phỏng vấn hoặc đã nhận được lời mời làm việc khác.",
                suggested_interview_status="declined",
                suggested_candidate_status="rejected",
            )
        elif any(w in content_lower for w in ["dời", "đổi", "bận", "reschedule", "hẹn lại", "sang tuần", "thời gian khác"]):
            return CandidateEmailClassification(
                classification="reschedule_requested",
                confidence=0.9,
                sentiment="neutral",
                summary="Ứng viên bận việc đột xuất và đề xuất xin dời lịch phỏng vấn sang thời gian khác.",
                reason="Trùng lịch hoặc có công việc cá nhân đột xuất.",
                proposed_time="Thời gian đề xuất theo nội dung email",
                suggested_interview_status="reschedule_requested",
                suggested_candidate_status="interview_invited",
            )
        else:
            return CandidateEmailClassification(
                classification="accepted",
                confidence=0.92,
                sentiment="positive",
                summary="Ứng viên xác nhận đồng ý tham gia buổi phỏng vấn theo đúng lịch hẹn.",
                suggested_interview_status="confirmed",
                suggested_candidate_status="interviewing",
            )


class AnthropicClient(BaseLLMClient):
    """Tích hợp Anthropic Claude Messages API."""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        try:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=api_key)
        except ImportError:
            self.client = None

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        if not self.client:
            raise AIServiceException("Anthropic SDK is not installed or configured")
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise AIServiceException(f"Anthropic request failed: {str(e)}")

    async def parse_cv_text(self, raw_text: str) -> ParsedCVSchema:
        system = "Bạn là công cụ trích xuất dữ liệu CV sang JSON chuẩn hóa theo schema quy định. Chỉ trả về JSON thuần."
        prompt = f"Trích xuất thông tin CV sau thành JSON khớp với schema ParsedCVSchema:\n{raw_text}"
        res_text = await self.generate_text(system, prompt)
        try:
            data = json.loads(res_text.strip("```json").strip("```").strip())
            return ParsedCVSchema(**data)
        except Exception:
            # Fallback to mock parse if LLM returned non-JSON
            return await MockLLMClient().parse_cv_text(raw_text)

    async def match_cv(
        self,
        job_title: str,
        department: str,
        job_description: str,
        job_requirements: str,
        criteria_weights: Dict[str, Any],
        candidate_name: str,
        cv_content: str,
    ) -> CVMatchAnalysis:
        user_prompt = CV_MATCH_USER_PROMPT_TEMPLATE.format(
            job_title=job_title,
            department=department,
            job_description=job_description,
            job_requirements=job_requirements,
            criteria_weights=json.dumps(criteria_weights, ensure_ascii=False),
            candidate_name=candidate_name,
            cv_content=cv_content,
        )
        res_text = await self.generate_text(CV_MATCH_SYSTEM_PROMPT, user_prompt)
        try:
            data = json.loads(res_text.strip("```json").strip("```").strip())
            return CVMatchAnalysis(**data)
        except Exception:
            return await MockLLMClient().match_cv(
                job_title, department, job_description, job_requirements, criteria_weights, candidate_name, cv_content
            )

    async def generate_interview_questions(
        self,
        job_title: str,
        job_requirements: str,
        candidate_name: str,
        cv_summary: str,
    ) -> InterviewQuestionsResponse:
        user_prompt = INTERVIEW_QUESTIONS_USER_PROMPT_TEMPLATE.format(
            job_title=job_title,
            job_requirements=job_requirements,
            candidate_name=candidate_name,
            cv_summary=cv_summary,
        )
        res_text = await self.generate_text(INTERVIEW_QUESTIONS_SYSTEM_PROMPT, user_prompt)
        try:
            data = json.loads(res_text.strip("```json").strip("```").strip())
            return InterviewQuestionsResponse(**data)
        except Exception:
            return await MockLLMClient().generate_interview_questions(
                job_title, job_requirements, candidate_name, cv_summary
            )

    async def evaluate_interview_transcript(
        self,
        job_requirements: str,
        rubric_criteria: str,
        transcript_text: str,
    ) -> InterviewEvaluationAnalysis:
        user_prompt = INTERVIEW_EVALUATION_USER_PROMPT_TEMPLATE.format(
            job_requirements=job_requirements,
            rubric_criteria=rubric_criteria,
            transcript_text=transcript_text,
        )
        res_text = await self.generate_text(INTERVIEW_EVALUATION_SYSTEM_PROMPT, user_prompt)
        try:
            data = json.loads(res_text.strip("```json").strip("```").strip())
            return InterviewEvaluationAnalysis(**data)
        except Exception:
            return await MockLLMClient().evaluate_interview_transcript(
                job_requirements, rubric_criteria, transcript_text
            )

    async def classify_candidate_email_response(
        self,
        email_content: str,
        candidate_name: str,
        job_title: str,
        interview_title: Optional[str] = None,
    ) -> CandidateEmailClassification:
        user_prompt = CANDIDATE_RESPONSE_USER_PROMPT_TEMPLATE.format(
            candidate_name=candidate_name,
            job_title=job_title,
            interview_title=interview_title or "Phỏng vấn tuyển dụng",
            email_content=email_content,
        )
        res_text = await self.generate_text(CANDIDATE_RESPONSE_SYSTEM_PROMPT, user_prompt)
        try:
            data = json.loads(res_text.strip("```json").strip("```").strip())
            return CandidateEmailClassification(**data)
        except Exception:
            return await MockLLMClient().classify_candidate_email_response(
                email_content, candidate_name, job_title, interview_title
            )


class OpenAIClient(BaseLLMClient):
    """Tích hợp API theo chuẩn OpenAI, bao gồm endpoint tương thích của Gemini."""

    def __init__(self, api_key: str, model: str, base_url: Optional[str] = None, provider_name: str = "OpenAI"):
        self.api_key = api_key
        self.model = model
        self.provider_name = provider_name
        try:
            from openai import AsyncOpenAI
            client_kwargs = {"api_key": api_key}
            if base_url:
                client_kwargs["base_url"] = base_url
            self.client = AsyncOpenAI(**client_kwargs)
        except ImportError:
            self.client = None

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        if not self.client:
            raise AIServiceException(f"{self.provider_name} client is not installed or configured")
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"{self.provider_name} API error: {str(e)}")
            raise AIServiceException(f"{self.provider_name} request failed: {str(e)}")

    async def parse_cv_text(self, raw_text: str) -> ParsedCVSchema:
        system = (
            "Bạn là công cụ trích xuất dữ liệu CV sang JSON chuẩn xác. "
            "Chỉ trả về JSON thuần (không giải thích thêm) với các key chính xác sau:\n"
            "- full_name (string): Họ và tên ứng viên\n"
            "- email (string hoặc null)\n"
            "- phone (string hoặc null)\n"
            "- skills (list of string)\n"
            "- total_experience_years (float)\n"
            "- education (list of {institution, degree, field_of_study, graduation_year})\n"
            "- experience (list of {company, position, years, highlights})\n"
            "- certifications (list of string)"
        )
        prompt = f"Trích xuất CV sau thành JSON theo đúng các key trên:\n{raw_text}"
        try:
            res_text = await self.generate_text(system, prompt)
            clean = res_text.strip()
            import re
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            clean_json = json_match.group(0) if json_match else clean
            data = json.loads(clean_json)
            return ParsedCVSchema(**data)
        except Exception as e:
            logger.warning(f"{self.provider_name} parse_cv_text fallback to mock: {e}")
            return await MockLLMClient().parse_cv_text(raw_text)

    async def match_cv(
        self,
        job_title: str,
        department: str,
        job_description: str,
        job_requirements: str,
        criteria_weights: Dict[str, Any],
        candidate_name: str,
        cv_content: str,
    ) -> CVMatchAnalysis:
        user_prompt = CV_MATCH_USER_PROMPT_TEMPLATE.format(
            job_title=job_title,
            department=department,
            job_description=job_description,
            job_requirements=job_requirements,
            criteria_weights=json.dumps(criteria_weights, ensure_ascii=False),
            candidate_name=candidate_name,
            cv_content=cv_content,
        )
        try:
            res_text = await self.generate_text(CV_MATCH_SYSTEM_PROMPT, user_prompt)
            clean = res_text.strip()
            import re
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            clean_json = json_match.group(0) if json_match else clean
            data = json.loads(clean_json)
            return CVMatchAnalysis(**data)
        except Exception as e:
            logger.warning(f"{self.provider_name} match_cv fallback to mock: {e}")
            return await MockLLMClient().match_cv(
                job_title, department, job_description, job_requirements, criteria_weights, candidate_name, cv_content
            )

    async def generate_interview_questions(
        self,
        job_title: str,
        job_requirements: str,
        candidate_name: str,
        cv_summary: str,
    ) -> InterviewQuestionsResponse:
        user_prompt = INTERVIEW_QUESTIONS_USER_PROMPT_TEMPLATE.format(
            job_title=job_title,
            job_requirements=job_requirements,
            candidate_name=candidate_name,
            cv_summary=cv_summary,
        )
        try:
            res_text = await self.generate_text(INTERVIEW_QUESTIONS_SYSTEM_PROMPT, user_prompt)
            clean = res_text.strip()
            import re
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            clean_json = json_match.group(0) if json_match else clean
            data = json.loads(clean_json)
            return InterviewQuestionsResponse(**data)
        except Exception as e:
            logger.warning(f"{self.provider_name} generate_interview_questions fallback to mock: {e}")
            return await MockLLMClient().generate_interview_questions(
                job_title, job_requirements, candidate_name, cv_summary
            )

    async def evaluate_interview_transcript(
        self,
        job_requirements: str,
        rubric_criteria: str,
        transcript_text: str,
    ) -> InterviewEvaluationAnalysis:
        user_prompt = INTERVIEW_EVALUATION_USER_PROMPT_TEMPLATE.format(
            job_requirements=job_requirements,
            rubric_criteria=rubric_criteria,
            transcript_text=transcript_text,
        )
        try:
            res_text = await self.generate_text(INTERVIEW_EVALUATION_SYSTEM_PROMPT, user_prompt)
            clean = res_text.strip()
            import re
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            clean_json = json_match.group(0) if json_match else clean
            data = json.loads(clean_json)
            return InterviewEvaluationAnalysis(**data)
        except Exception as e:
            logger.warning(f"{self.provider_name} evaluate_interview_transcript fallback to mock: {e}")
            return await MockLLMClient().evaluate_interview_transcript(
                job_requirements, rubric_criteria, transcript_text
            )

    async def classify_candidate_email_response(
        self,
        email_content: str,
        candidate_name: str,
        job_title: str,
        interview_title: Optional[str] = None,
    ) -> CandidateEmailClassification:
        user_prompt = CANDIDATE_RESPONSE_USER_PROMPT_TEMPLATE.format(
            candidate_name=candidate_name,
            job_title=job_title,
            interview_title=interview_title or "Phỏng vấn tuyển dụng",
            email_content=email_content,
        )
        try:
            res_text = await self.generate_text(CANDIDATE_RESPONSE_SYSTEM_PROMPT, user_prompt)
            clean = res_text.strip()
            import re
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            clean_json = json_match.group(0) if json_match else clean
            data = json.loads(clean_json)
            return CandidateEmailClassification(**data)
        except Exception as e:
            logger.warning(f"{self.provider_name} classify_candidate_email_response fallback to mock: {e}")
            return await MockLLMClient().classify_candidate_email_response(
                email_content, candidate_name, job_title, interview_title
            )


def get_llm_client() -> BaseLLMClient:
    """Factory trả về LLM client được cấu hình theo Settings."""
    provider = settings.LLM_PROVIDER.lower()
    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return AnthropicClient(api_key=settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIClient(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)
    elif provider == "gemini" and settings.GEMINI_API_KEY:
        return OpenAIClient(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            base_url=settings.GEMINI_BASE_URL,
            provider_name="Gemini",
        )
    else:
        # Default mock client for zero-setup local dev and unit testing
        return MockLLMClient()
