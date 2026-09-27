from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator
import re


# 1. Parsed CV Schema
class EducationItem(BaseModel):
    institution: Optional[str] = Field("Chưa cập nhật", description="Tên trường đại học / cao đẳng / viện đào tạo")
    degree: Optional[str] = Field("Chưa cập nhật", description="Bằng cấp / học vị (Cử nhân, Kỹ sư, Thạc sĩ...)")
    field_of_study: Optional[str] = Field(None, description="Chuyên ngành")
    graduation_year: Optional[int] = Field(None, description="Năm tốt nghiệp")


class ExperienceItem(BaseModel):
    company: Optional[str] = Field("Chưa cập nhật", description="Tên công ty / tổ chức")
    position: Optional[str] = Field("Chuyên viên", description="Chức danh / vị trí đảm nhiệm")
    years: Optional[float] = Field(0.0, description="Thời gian làm việc tính theo năm")
    highlights: List[str] = Field(default_factory=list, description="Thành tựu hoặc trách nhiệm chính")

    @field_validator("years", mode="before")
    def parse_years(cls, v):
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            m = re.search(r"(\d+(\.\d+)?)", v)
            if m:
                return float(m.group(1))
        return 0.0


class ParsedCVSchema(BaseModel):
    full_name: str = Field("Ứng viên", description="Họ và tên ứng viên")
    email: Optional[str] = Field(None, description="Địa chỉ email")
    phone: Optional[str] = Field(None, description="Số điện thoại")
    skills: List[str] = Field(default_factory=list, description="Danh sách kỹ năng kỹ thuật & mềm")
    total_experience_years: float = Field(0.0, description="Tổng số năm kinh nghiệm làm việc")
    education: List[EducationItem] = Field(default_factory=list, description="Lịch sử học vấn")
    experience: List[ExperienceItem] = Field(default_factory=list, description="Lịch sử công tác")
    certifications: List[str] = Field(default_factory=list, description="Các chứng chỉ chuyên môn")

    @field_validator("total_experience_years", mode="before")
    def parse_total_years(cls, v):
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            m = re.search(r"(\d+(\.\d+)?)", v)
            if m:
                return float(m.group(1))
        return 0.0


# 2. CV-JD Match Analysis Schema
class CriteriaScore(BaseModel):
    name: str = Field(..., description="Tên tiêu chí (Kỹ năng bắt buộc, Kinh nghiệm, Học vấn, Kỹ năng ưu tiên)")
    weight: float = Field(..., description="Trọng số tiêu chí (ví dụ: 0.4)")
    score: float = Field(..., description="Điểm số thành phần từ 0 đến 100")
    explanation: str = Field(..., description="Giải thích chi tiết cho điểm số này")


class CVMatchAnalysis(BaseModel):
    overall_score: float = Field(..., description="Tổng điểm phù hợp từ 0 đến 100")
    breakdown: List[CriteriaScore] = Field(..., description="Điểm chi tiết theo từng tiêu chí")
    strengths: List[str] = Field(default_factory=list, description="Điểm mạnh nổi bật của ứng viên đối với JD")
    gaps: List[str] = Field(default_factory=list, description="Điểm còn thiếu hoặc chưa đạt so với JD")
    recommendation: str = Field(..., description="Khuyến nghị cho HR (Phỏng vấn ngay / Cân nhắc / Không phù hợp)")


# 3. AI Interview Questions Schema
class SuggestedQuestion(BaseModel):
    category: str = Field("Chuyên môn kỹ thuật", description="Nhóm câu hỏi: Chuyên môn kỹ thuật, Giải quyết vấn đề, Văn hóa & Giao tiếp")
    question: str = Field(..., description="Nội dung câu hỏi phỏng vấn")
    rationale: str = Field("", description="Lý do nên hỏi câu này (gắn với CV/JD)")
    expected_answer_points: List[str] = Field(default_factory=list, description="Điểm cốt lõi kỳ vọng trong câu trả lời")
    difficulty: str = Field("medium", description="Độ khó: easy | medium | hard")

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("rationale"):
                for k in ["reason", "explanation", "purpose"]:
                    if data.get(k):
                        data["rationale"] = str(data[k])
                        break
            if not data.get("expected_answer_points"):
                for k in ["expected_answer", "expected_points", "points", "expected", "key_points", "answer_points"]:
                    if data.get(k):
                        ans = data[k]
                        data["expected_answer_points"] = [ans] if isinstance(ans, str) else list(ans)
                        break
        return data


class InterviewQuestionsResponse(BaseModel):
    candidate_name: Optional[str] = "Ứng viên"
    target_role: Optional[str] = "Vị trí tuyển dụng"
    questions: List[SuggestedQuestion] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_response(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("questions"):
                for key in ["interview_questions", "suggested_questions", "items", "question_list"]:
                    if key in data and isinstance(data[key], list):
                        data["questions"] = data[key]
                        break
        elif isinstance(data, list):
            data = {"questions": data}
        return data


# 4. Transcript & Evaluation Schema
class TranscriptSegment(BaseModel):
    speaker: str = Field(..., description="Nhãn người nói: HR / Interviewer / Candidate")
    start_time: float = Field(..., description="Thời gian bắt đầu (giây)")
    end_time: float = Field(..., description="Thời gian kết thúc (giây)")
    text: str = Field(..., description="Nội dung phát ngôn")


class RubricItemScore(BaseModel):
    criterion: str = Field(..., description="Tiêu chí đánh giá rubric")
    score: float = Field(..., description="Thang điểm 1-10 hoặc 1-100")
    evidence_quote: str = Field("", description="Trích dẫn lời nói ứng viên kèm timestamp minh chứng")
    comment: str = Field("", description="Nhận xét cụ thể")

    @model_validator(mode="before")
    @classmethod
    def normalize_rubric_item(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("comment") and data.get("explanation"):
                data["comment"] = data["explanation"]
            if not data.get("criterion"):
                for k in ["name", "criteria", "title"]:
                    if data.get(k):
                        data["criterion"] = data[k]
                        break
            if not data.get("evidence_quote"):
                for k in ["evidence", "quote", "timestamp_evidence"]:
                    if data.get(k):
                        data["evidence_quote"] = str(data[k])
                        break
        return data


class InterviewEvaluationAnalysis(BaseModel):
    summary: str = Field(..., description="Tóm tắt tổng quan buổi phỏng vấn")
    overall_rating: float = Field(..., description="Điểm đánh giá trung bình")
    rubric_scores: List[RubricItemScore] = Field(default_factory=list)
    key_strengths: List[str] = Field(default_factory=list)
    areas_for_growth: List[str] = Field(default_factory=list)
    recommendation: str = Field(..., description="Đề xuất: Pass / Hold / Reject")

    @model_validator(mode="before")
    @classmethod
    def normalize_evaluation(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ["interview_evaluation", "evaluation", "data", "result", "analysis"]:
                if key in data and isinstance(data[key], dict):
                    data = data[key]
                    break
            # Map alternative rating/score keys
            if not data.get("overall_rating") and data.get("overall_score"):
                data["overall_rating"] = data["overall_score"]
            if not data.get("recommendation"):
                for k in ["decision", "verdict", "final_recommendation", "status"]:
                    if data.get(k):
                        data["recommendation"] = str(data[k])
                        break
            # Handle overall_rating if returned out of 100 or as string
            if "overall_rating" in data:
                try:
                    val = float(data["overall_rating"])
                    if val > 10.0 and val <= 100.0:
                        val = val / 10.0
                    data["overall_rating"] = val
                except (ValueError, TypeError):
                    pass
        return data


# 5. Candidate Email Response Classification Schema
class CandidateEmailClassification(BaseModel):
    classification: str = Field(
        ...,
        description="Phân loại ý định: 'accepted' (Chấp nhận/Đồng ý) | 'declined' (Từ chối/Hủy/Rút lui) | 'reschedule_requested' (Xin dời lịch/Đổi giờ) | 'other' (Ý kiến khác)"
    )
    confidence: float = Field(0.9, description="Độ tin cậy từ 0.0 đến 1.0")
    sentiment: str = Field("neutral", description="'positive' | 'negative' | 'neutral'")
    summary: str = Field(..., description="Tóm tắt ngắn gọn ý chính phản hồi của ứng viên")
    reason: Optional[str] = Field(None, description="Lý do ứng viên đưa ra (nếu có)")
    proposed_time: Optional[str] = Field(None, description="Thời gian đề xuất dời sang (nếu có)")
    suggested_interview_status: str = Field(
        "pending",
        description="'confirmed' nếu accepted | 'declined' nếu declined | 'reschedule_requested' nếu reschedule"
    )
    suggested_candidate_status: str = Field(
        "interview_invited",
        description="'interviewing' nếu accepted | 'rejected' nếu declined | 'interview_invited' nếu reschedule"
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_classification(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize classification
            c = str(data.get("classification", "")).lower()
            if any(k in c for k in ["accept", "agree", "confirm", "dong_y", "đồng ý", "tham gia"]):
                data["classification"] = "accepted"
                data["suggested_interview_status"] = "confirmed"
                data["suggested_candidate_status"] = "interviewing"
            elif any(k in c for k in ["decline", "reject", "cancel", "tu_choi", "từ chối", "hủy", "rút"]):
                data["classification"] = "declined"
                data["suggested_interview_status"] = "declined"
                data["suggested_candidate_status"] = "rejected"
            elif any(k in c for k in ["reschedule", "doi_lich", "dời", "đổi", "bận"]):
                data["classification"] = "reschedule_requested"
                data["suggested_interview_status"] = "reschedule_requested"
                data["suggested_candidate_status"] = "interview_invited"
        return data

