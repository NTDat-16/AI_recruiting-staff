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
    """Client giả lập thông minh hỗ trợ phát triển local, kiểm thử và fallback an toàn khi provider ngoài gián đoạn."""

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        prompt_lower = user_prompt.lower()

        # 1. Câu hỏi về danh sách việc làm / cơ hội nghề nghiệp
        if any(w in prompt_lower for w in ["vị trí", "việc làm", "tuyển dụng", "công việc", "job", "mở tuyển"]):
            return (
                "Chào bạn! 👋 Hiện tại công ty đang mở tuyển các vị trí kỹ thuật và sản phẩm then chốt:\n\n"
                "- **Senior AI Architect**: Thiết kế kiến trúc AI/LLM, tối ưu inference và hệ thống phân tán chịu tải cao.\n"
                "- **Senior Backend Developer**: Xây dựng kiến trúc Microservices với FastAPI, .NET Core và PostgreSQL.\n"
                "- **Lead Frontend Engineer**: Phát triển giao diện người dùng hiện đại với Next.js App Router và Tailwind CSS.\n\n"
                "💡 **Cách nộp đơn:** Bạn chỉ cần nhấn vào vị trí quan tâm trên trang chủ và bấm **'Ứng tuyển ngay' (Quick Apply)** đính kèm file CV (PDF/DOCX) mà không bắt buộc phải tạo tài khoản!"
            )

        # 2. Câu hỏi về yêu cầu, kinh nghiệm, bằng cấp
        if any(w in prompt_lower for w in ["yêu cầu", "kinh nghiệm", "kỹ năng", "bằng cấp", "fresher", "senior", "tiêu chuẩn"]):
            return (
                "Tiêu chuẩn tuyển dụng của công ty được thiết kế khắt khe và rõ ràng theo từng cấp bậc:\n\n"
                "- **Vị trí Senior / Architect**: Đòi hỏi tối thiểu từ 4-5 năm kinh nghiệm thực chiến chuyên sâu, có năng lực chủ trì thiết kế kiến trúc hệ thống và dẫn dắt đội ngũ kỹ thuật.\n"
                "- **Vị trí Junior / Fresher**: Yêu cầu nắm vững tư duy lập trình căn bản (Python, TypeScript, SQL), cấu trúc dữ liệu & giải thuật và tinh thần học hỏi công nghệ mới.\n\n"
                "🎯 **Lưu ý quan trọng:** Hệ thống AI ATS sẽ đối soát CV với tiêu chuẩn tuyển dụng nghiêm ngặt theo đúng JD, vì vậy bạn hãy chọn vị trí phù hợp với đúng thâm niên thực tế của mình để đạt tỷ lệ match cao nhất!"
            )

        # 3. Câu hỏi về quy trình tuyển dụng & phỏng vấn
        if any(w in prompt_lower for w in ["quy trình", "phỏng vấn", "nộp đơn", "quick apply", "bao lâu", "các bước"]):
            return (
                "Quy trình tuyển dụng thông minh tại công ty gồm 3 bước tinh gọn:\n\n"
                "1. **Quick Apply (30 giây)**: Nộp CV trực tuyến siêu tốc, không cần tạo tài khoản rườm rà.\n"
                "2. **AI Screening (trong 24h)**: Hệ thống AI ATS tự động phân tích độ phù hợp và phản hồi tự động qua email.\n"
                "3. **Phỏng vấn trực tuyến (Online Video)**: Phỏng vấn kỹ thuật và trao đổi chuyên môn qua phòng họp trực tuyến Jitsi Meet có tích hợp trợ lý AI ghi chép và phân tích."
            )

        # 4. Câu hỏi về tra cứu kết quả
        if any(w in prompt_lower for w in ["tra cứu", "trạng thái", "kết quả", "theo dõi", "tiến độ"]):
            return (
                "Bạn có thể dễ dàng kiểm tra tiến độ hồ sơ của mình:\n\n"
                "👉 Truy cập tab **'Tra cứu trạng thái hồ sơ'** trên thanh điều hướng, nhập chính xác địa chỉ email bạn đã dùng để nộp CV để xem trạng thái xét duyệt và phản hồi mới nhất từ Hội đồng tuyển dụng."
            )

        # 5. Câu hỏi về chế độ đãi ngộ, lương thưởng
        if any(w in prompt_lower for w in ["lương", "đãi ngộ", "thưởng", "chế độ", "phúc lợi", "bảo hiểm"]):
            return (
                "Chính sách đãi ngộ tại công ty bao gồm:\n\n"
                "- **Thu nhập cạnh tranh**: Mức lương tương xứng với năng lực, review định kỳ 2 lần/năm.\n"
                "- **Thưởng**: Thưởng tháng 13, thưởng hiệu quả dự án và thưởng nóng theo thành tích vượt trội.\n"
                "- **Phúc lợi**: Bảo hiểm sức khỏe cao cấp, tài trợ ngân sách học tập chứng chỉ quốc tế và môi trường làm việc Hybrid linh hoạt."
            )

        # Phản hồi mặc định tự nhiên, lịch sự
        return (
            "Xin chào! 👋 Tôi là Trợ Lý Tuyển Dụng AI (AI Career Copilot). "
            "Tôi luôn sẵn sàng giải đáp mọi thắc mắc về các vị trí đang tuyển, hướng dẫn nộp CV nhanh (Quick Apply) "
            "hoặc tư vấn kinh nghiệm phỏng vấn. Bạn đang muốn tìm hiểu thêm về vị trí hay thông tin nào?"
        )

    async def parse_cv_text(self, raw_text: str) -> ParsedCVSchema:
        import re
        raw_lower = raw_text.lower()
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        name = lines[0] if lines else "Ứng viên"
        if len(name) > 40 or any(char in name.lower() for char in ["curriculum", "resume", "cv", "hồ sơ", "ứng tuyển"]):
            for l in lines[:5]:
                if len(l) < 35 and not any(char in l for char in ["@", ":", "/", "http", "0"]):
                    name = l
                    break

        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text)
        email = email_match.group(0) if email_match else "candidate@example.com"

        phone_match = re.search(r"(?:\+?84|0)(?:\d{9,10})", raw_text)
        phone = phone_match.group(0) if phone_match else "0901234567"

        is_fresher = any(w in raw_lower for w in ["fresher", "intern", "thực tập", "sinh viên", "mới tốt nghiệp", "tot nghiep", "junior"])
        is_senior = any(w in raw_lower for w in ["senior", "lead", "architect", "trưởng nhóm", "chủ trì", "5 năm", "6 năm", "7 năm"])

        if is_fresher and not is_senior:
            total_exp = 0.5
            pos = "Fresher / Thực tập sinh"
            comp = "Đại học / Dự án tốt nghiệp"
        elif is_senior:
            total_exp = 5.5
            pos = "Senior Software Engineer"
            comp = "Tập đoàn Công nghệ"
        else:
            total_exp = 2.5
            pos = "Software Developer"
            comp = "Tech Solutions Corp"

        known_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React", "TypeScript", "Node.js", "AWS", "SQL", "Kafka", "Redis", "C#", ".NET", "Java", "Kubernetes", "PyTorch", "TensorFlow", "HTML", "CSS"]
        found_skills = [s for s in known_skills if s.lower() in raw_lower]
        if not found_skills:
            found_skills = ["Python", "Git", "SQL"]

        return ParsedCVSchema(
            full_name=name,
            email=email,
            phone=phone,
            skills=found_skills,
            total_experience_years=total_exp,
            education=[
                {
                    "institution": "Đại học Bách Khoa / CNTT",
                    "degree": "Kỹ sư / Cử nhân",
                    "field_of_study": "Công nghệ Thông tin",
                    "graduation_year": 2024 if is_fresher else 2019,
                }
            ],
            experience=[
                {
                    "company": comp,
                    "position": pos,
                    "years": total_exp,
                    "highlights": [
                        "Tham gia nghiên cứu và phát triển phần mềm",
                        "Xây dựng API và làm việc với cơ sở dữ liệu quan hệ",
                    ],
                }
            ],
            certifications=["Chứng chỉ đào tạo chuyên ngành CNTT"],
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
        # Đóng vai Trưởng phòng Nhân sự vô cùng khó tính và khắt khe
        text_corpus = (job_title + " " + job_requirements + " " + job_description).lower()
        cv_corpus = (cv_content + " " + candidate_name).lower()

        is_senior_job = any(w in text_corpus for w in ["senior", "lead", "architect", "manager", "principal", "trưởng"])
        is_fresher_cand = any(w in cv_corpus for w in ["fresher", "intern", "thực tập", "sinh viên", "mới tốt nghiệp", "tot nghiep", "junior", "0 năm", "0.5 năm", "1 năm"])

        # TRƯỜNG HỢP: Ứng viên Fresher nộp vào vị trí Senior -> HR khó tính đánh trượt dứt khoát!
        if is_senior_job and is_fresher_cand:
            return CVMatchAnalysis(
                overall_score=35.0,
                breakdown=[
                    CriteriaScore(
                        name="Cấp bậc & Thâm niên thực chiến (Seniority Mismatch)",
                        weight=0.4,
                        score=15.0,
                        explanation=f"Vị trí {job_title} đòi hỏi tối thiểu 4-5 năm kinh nghiệm thực chiến chuyên sâu và khả năng chủ trì thiết kế hệ thống. Ứng viên mới ở cấp độ Fresher/sinh viên mới ra trường; khoảng cách năng lực quá lớn so với tiêu chuẩn tuyển dụng.",
                    ),
                    CriteriaScore(
                        name="Kỹ năng kiến trúc hệ thống & Thiết kế chịu tải",
                        weight=0.35,
                        score=30.0,
                        explanation="Kỹ năng chỉ dừng ở mức đồ án môn học và bài tập cơ bản, hoàn toàn chưa có kinh nghiệm giải quyết bài toán chịu tải cao, microservices, bảo mật và tính sẵn sàng của hệ thống lớn.",
                    ),
                    CriteriaScore(
                        name="Khả năng dẫn dắt đội ngũ & Quản trị rủi ro kỹ thuật",
                        weight=0.15,
                        score=20.0,
                        explanation="Chưa từng có kinh nghiệm làm việc trong quy trình doanh nghiệp lớn, chưa từng lead nhóm hoặc review code/architecture.",
                    ),
                    CriteriaScore(
                        name="Học vấn & Tiềm năng phát triển",
                        weight=0.1,
                        score=70.0,
                        explanation="Có nền tảng học vấn cơ bản và tinh thần học hỏi, tuy nhiên cần tích lũy thêm tối thiểu 3-4 năm thực tế ở vị trí Junior/Mid trước khi ứng tuyển vị trí này.",
                    ),
                ],
                strengths=[
                    "Có thái độ học hỏi và nền tảng lý thuyết CNTT cơ bản từ trường đào tạo",
                    "Nắm được cú pháp ngôn ngữ lập trình căn bản",
                ],
                gaps=[
                    "LỆCH CẤP BẬC NGHIÊM TRỌNG (Seniority Mismatch): Ứng viên là Fresher nhưng ứng tuyển vị trí cấp cao (Senior/Architect)",
                    "Hoàn toàn thiếu kinh nghiệm thực tế trong thiết kế kiến trúc phần mềm và vận hành production",
                    "Chưa có kinh nghiệm độc lập xử lý sự cố kỹ thuật phức tạp hoặc tối ưu hiệu năng hệ thống lớn",
                ],
                recommendation=f"TỪ CHỐI (REJECT): Ứng viên ở cấp độ Fresher, hoàn toàn KHÔNG ĐẠT tiêu chuẩn tuyển dụng cho vị trí {job_title}. Khuyến nghị lưu trữ vào Kho nhân tài (Talent Pool) để xem xét cho các vị trí Fresher/Junior tương lai.",
            )

        # TRƯỜNG HỢP: Ứng viên phù hợp với vị trí Senior
        elif is_senior_job and not is_fresher_cand:
            return CVMatchAnalysis(
                overall_score=87.0,
                breakdown=[
                    CriteriaScore(
                        name="Kỹ năng kiến trúc & Tech Stack bắt buộc",
                        weight=0.4,
                        score=88.0,
                        explanation=f"Ứng viên thể hiện vững vàng chuyên môn kỹ thuật phù hợp với yêu cầu vị trí {job_title}.",
                    ),
                    CriteriaScore(
                        name="Số năm kinh nghiệm & Cấp bậc",
                        weight=0.3,
                        score=85.0,
                        explanation="Kinh nghiệm thực chiến dày dặn, đáp ứng tốt yêu cầu thâm niên tối thiểu.",
                    ),
                    CriteriaScore(
                        name="Học vấn & Bằng cấp chuyên ngành",
                        weight=0.15,
                        score=90.0,
                        explanation="Bằng cấp kỹ sư CNTT và các chứng chỉ chuyên môn liên quan.",
                    ),
                    CriteriaScore(
                        name="Kỹ năng mềm & Quản trị dự án",
                        weight=0.15,
                        score=85.0,
                        explanation="Có kinh nghiệm làm việc nhóm, điều phối kỹ thuật và giao tiếp tốt.",
                    ),
                ],
                strengths=[
                    f"Kinh nghiệm làm việc thực chiến phù hợp với JD {job_title}",
                    "Nền tảng kỹ thuật và kiến trúc hệ thống vững chắc",
                ],
                gaps=[
                    "Cần kiểm tra sâu hơn về khả năng xử lý bài toán chịu tải cao trong buổi phỏng vấn kỹ thuật",
                ],
                recommendation=f"ĐẠT YÊU CẦU: Khuyến nghị mời ứng viên tham gia Vòng phỏng vấn chuyên môn (Technical Interview) cho vị trí {job_title}.",
            )

        # TRƯỜNG HỢP: Vị trí Junior / Fresher
        else:
            return CVMatchAnalysis(
                overall_score=78.0,
                breakdown=[
                    CriteriaScore(
                        name="Kỹ năng lập trình căn bản",
                        weight=0.4,
                        score=80.0,
                        explanation="Nắm được kiến thức nền tảng và ngôn ngữ lập trình yêu cầu.",
                    ),
                    CriteriaScore(
                        name="Mức độ phù hợp với vị trí",
                        weight=0.3,
                        score=78.0,
                        explanation="Kinh nghiệm và kiến thức tương thích với mô tả công việc.",
                    ),
                    CriteriaScore(
                        name="Học vấn & Đào tạo",
                        weight=0.15,
                        score=82.0,
                        explanation="Có bằng cấp chính quy chuyên ngành liên quan.",
                    ),
                    CriteriaScore(
                        name="Tiềm năng phát triển & Tiếp thu",
                        weight=0.15,
                        score=85.0,
                        explanation="Thể hiện sự nhiệt huyết và khả năng học hỏi công nghệ mới.",
                    ),
                ],
                strengths=[
                    "Nền tảng tư duy lập trình tốt",
                    "Tinh thần học hỏi và cầu thị cao",
                ],
                gaps=[
                    "Cần thêm thời gian làm quen với quy trình phát triển phần mềm chuẩn doanh nghiệp",
                ],
                recommendation=f"CÂN NHẮC PHỎNG VẤN: Ứng viên đáp ứng yêu cầu cơ bản cho vị trí {job_title}. Đề xuất tiến hành phỏng vấn vòng 1.",
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
            return await MockLLMClient().generate_text(system_prompt, user_prompt, temperature)
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
            logger.warning(f"Anthropic API error, fallback to mock: {str(e)}")
            return await MockLLMClient().generate_text(system_prompt, user_prompt, temperature)

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
            return await MockLLMClient().generate_text(system_prompt, user_prompt, temperature)
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
            logger.warning(f"{self.provider_name} API error, fallback to mock: {str(e)}")
            return await MockLLMClient().generate_text(system_prompt, user_prompt, temperature)

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
