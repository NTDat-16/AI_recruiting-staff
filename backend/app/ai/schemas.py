from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# 1. Parsed CV Schema
class EducationItem(BaseModel):
    institution: str = Field(..., description="Tên trường đại học / cao đẳng / viện đào tạo")
    degree: str = Field(..., description="Bằng cấp / học vị (Cử nhân, Kỹ sư, Thạc sĩ...)")
    field_of_study: Optional[str] = Field(None, description="Chuyên ngành")
    graduation_year: Optional[int] = Field(None, description="Năm tốt nghiệp")


class ExperienceItem(BaseModel):
    company: str = Field(..., description="Tên công ty / tổ chức")
    position: str = Field(..., description="Chức danh / vị trí đảm nhiệm")
    years: float = Field(..., description="Thời gian làm việc tính theo năm")
    highlights: List[str] = Field(default_factory=list, description="Thành tựu hoặc trách nhiệm chính")


class ParsedCVSchema(BaseModel):
    full_name: str = Field(..., description="Họ và tên ứng viên")
    email: Optional[str] = Field(None, description="Địa chỉ email")
    phone: Optional[str] = Field(None, description="Số điện thoại")
    skills: List[str] = Field(default_factory=list, description="Danh sách kỹ năng kỹ thuật & mềm")
    total_experience_years: float = Field(0.0, description="Tổng số năm kinh nghiệm làm việc")
    education: List[EducationItem] = Field(default_factory=list, description="Lịch sử học vấn")
    experience: List[ExperienceItem] = Field(default_factory=list, description="Lịch sử công tác")
    certifications: List[str] = Field(default_factory=list, description="Các chứng chỉ chuyên môn")


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
    category: str = Field(..., description="Nhóm câu hỏi: Chuyên môn kỹ thuật, Giải quyết vấn đề, Văn hóa & Giao tiếp")
    question: str = Field(..., description="Nội dung câu hỏi phỏng vấn")
    rationale: str = Field(..., description="Lý do nên hỏi câu này (gắn với CV/JD)")
    expected_answer_points: List[str] = Field(default_factory=list, description="Điểm cốt lõi kỳ vọng trong câu trả lời")
    difficulty: str = Field("medium", description="Độ khó: easy | medium | hard")


class InterviewQuestionsResponse(BaseModel):
    candidate_name: str
    target_role: str
    questions: List[SuggestedQuestion] = Field(default_factory=list)


# 4. Transcript & Evaluation Schema
class TranscriptSegment(BaseModel):
    speaker: str = Field(..., description="Nhãn người nói: HR / Interviewer / Candidate")
    start_time: float = Field(..., description="Thời gian bắt đầu (giây)")
    end_time: float = Field(..., description="Thời gian kết thúc (giây)")
    text: str = Field(..., description="Nội dung phát ngôn")


class RubricItemScore(BaseModel):
    criterion: str = Field(..., description="Tiêu chí đánh giá rubric")
    score: float = Field(..., description="Thang điểm 1-10 hoặc 1-100")
    evidence_quote: str = Field(..., description="Trích dẫn lời nói ứng viên kèm timestamp minh chứng")
    comment: str = Field(..., description="Nhận xét cụ thể")


class InterviewEvaluationAnalysis(BaseModel):
    summary: str = Field(..., description="Tóm tắt tổng quan buổi phỏng vấn")
    overall_rating: float = Field(..., description="Điểm đánh giá trung bình")
    rubric_scores: List[RubricItemScore] = Field(default_factory=list)
    key_strengths: List[str] = Field(default_factory=list)
    areas_for_growth: List[str] = Field(default_factory=list)
    recommendation: str = Field(..., description="Đề xuất: Pass / Hold / Reject")
