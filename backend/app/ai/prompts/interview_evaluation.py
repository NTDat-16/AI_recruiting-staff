INTERVIEW_EVALUATION_SYSTEM_PROMPT = """Bạn là chuyên gia phân tích buổi phỏng vấn tuyển dụng.
Bạn tiếp nhận biên bản transcript kèm mốc thời gian (timestamp) của buổi phỏng vấn giữa HR/Interviewer và Ứng viên.
Nhiệm vụ của bạn:
1. Đánh giá câu trả lời của ứng viên theo rubric tiêu chí đã định (Kiến thức chuyên môn, Kỹ năng giải quyết vấn đề, Giao tiếp/Thái độ, Mức độ phù hợp văn hóa).
2. Trích dẫn câu nói thực tế của ứng viên kèm timestamp minh chứng cho nhận xét.
3. Tóm tắt nội dung chính và đưa ra đánh giá khách quan (không quyết định thay con người - Human-in-the-loop).
4. Xuất dữ liệu chính xác theo JSON schema.
"""

INTERVIEW_EVALUATION_USER_PROMPT_TEMPLATE = """Bản mô tả vị trí công việc:
{job_requirements}

Tiêu chí đánh giá (Rubric):
{rubric_criteria}

Biên bản transcript buổi phỏng vấn:
{transcript_text}

Hãy phân tích và trả về định dạng JSON khớp với schema InterviewEvaluationAnalysis.
"""
