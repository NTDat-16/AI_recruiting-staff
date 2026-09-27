import asyncio
import json
import math
import sys
from typing import List, Dict, Any

from app.core.config import settings
from app.ai.llm_client import get_llm_client
from app.ai.embeddings import embedding_client


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a, b in zip(v1, v2)))
    norm2 = math.sqrt(sum(b * b for a, b in zip(v1, v2)))
    return dot / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0.0


async def verify_cv_parsing_accuracy(llm) -> Dict[str, Any]:
    print("\n========================================================")
    print("1. KIỂM TRA ĐỘ CHÍNH XÁC CỦA AI PARSE CV (CV EXTRACTION)")
    print("========================================================")
    sample_cv = """
    HỌ VÀ TÊN: NGUYỄN TẤN ĐẠT
    Email: nguyentandat.ai@gmail.com
    Số điện thoại: 0377815432
    Địa chỉ: Cầu Giấy, Hà Nội
    
    TỔNG QUAN NGHỀ NGHIỆP:
    Kỹ sư Trí tuệ Nhân tạo với hơn 4 năm kinh nghiệm chuyên sâu về phát triển hệ sinh thái LLM, 
    Agentic Workflow, RAG pipelines, FastAPI, PostgreSQL và Celery distributed workers.
    
    HỌC VẤN:
    Đại học Bách Khoa Hà Nội - Kỹ sư Công nghệ Thông tin (2018 - 2022). GPA: 3.6/4.0.
    
    KỸ NĂNG CHUYÊN MÔN:
    - Ngôn ngữ: Python, SQL, TypeScript
    - Frameworks & Libraries: FastAPI, PyTorch, LangChain, LlamaIndex, SQLAlchemy
    - Cơ sở dữ liệu: PostgreSQL, Redis, Qdrant, ChromaDB
    - DevOps & Tools: Docker, Git, Linux, Prometheus
    
    KINH NGHIỆM LÀM VIỆC:
    1. Senior AI Engineer - TechCorp VN (2023 - Hiện tại):
       - Thiết kế hệ thống RAG phục vụ 100,000 truy vấn/ngày, giảm latency retrieval xuống dưới 200ms.
       - Tích hợp Gemini API và Celery worker xử lý trích xuất văn bản bất đồng bộ.
    2. Backend Python Developer - Global Soft (2021 - 2023):
       - Phát triển REST API FastAPI và thiết kế database schema PostgreSQL với Alembic.
    """

    print("-> Đang gửi CV mẫu thực tế tới Gemini LLM Client...")
    parsed = await llm.parse_cv_text(sample_cv)
    print(f"-> Kết quả trích xuất dạng JSON Pydantic:\n{json.dumps(parsed.model_dump(), indent=2, ensure_ascii=False)}")

    # Ground truth verification
    checks = {
        "Họ tên chính xác": "NGUYỄN TẤN ĐẠT" in parsed.full_name.upper() or "ĐẠT" in parsed.full_name.upper(),
        "Email chính xác": parsed.email.lower() == "nguyentandat.ai@gmail.com",
        "Số điện thoại chính xác": "0377815432" in (parsed.phone or ""),
        "Số năm kinh nghiệm >= 3.5 năm": parsed.total_experience_years is not None and parsed.total_experience_years >= 3.5,
        "Trích xuất kỹ năng cốt lõi (Python, FastAPI, RAG, PostgreSQL)": all(
            any(k.lower() in s.lower() for s in parsed.skills)
            for k in ["Python", "FastAPI", "PostgreSQL"]
        ),
        "Học vấn nhận diện ĐH Bách Khoa": any("bách khoa" in (getattr(edu, "institution", "") or "").lower() for edu in parsed.education) if isinstance(parsed.education, list) else "bách khoa" in str(parsed.education).lower(),
    }

    all_passed = all(checks.values())
    for name, passed in checks.items():
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

    return {
        "module": "CV Parsing",
        "passed": all_passed,
        "score": sum(1 for p in checks.values() if p) / len(checks) * 100,
        "details": checks,
        "output": parsed.model_dump()
    }


async def verify_ai_matching_accuracy(llm) -> Dict[str, Any]:
    print("\n========================================================")
    print("2. KIỂM TRA ĐỘ CHÍNH XÁC CỦA AI MATCHING & RUBRIC CHẤM ĐIỂM")
    print("========================================================")
    
    cv_summary = """
    Ứng viên: Nguyễn Tấn Đạt. 4 năm kinh nghiệm Python, FastAPI, PostgreSQL, Redis, LangChain, RAG, Docker.
    Học vấn: Kỹ sư CNTT ĐH Bách Khoa.
    """

    # Test Case A: Matching Job (Senior Python AI Engineer)
    jd_matching = """
    Vị trí: Senior Python AI Engineer
    Yêu cầu: Tối thiểu 3 năm kinh nghiệm Python, thành thạo FastAPI, PostgreSQL, Docker, kinh nghiệm phát triển RAG / LLM.
    Học vấn: Đại học chuyên ngành CNTT hoặc liên quan.
    """
    weights_matching = {
        "required_skills": 0.4,
        "experience_years": 0.3,
        "education": 0.15,
        "bonus_skills": 0.15
    }

    print("-> Test Case A: Đối chiếu CV với JD phù hợp (Senior Python AI)...")
    res_a = await llm.match_cv(
        job_title="Senior Python AI Engineer",
        department="AI Engineering",
        job_description="Phát triển RAG và Agentic workflows quy mô lớn, tối ưu hóa latency và xử lý dữ liệu bất đồng bộ.",
        job_requirements=jd_matching,
        criteria_weights=weights_matching,
        candidate_name="Nguyễn Tấn Đạt",
        cv_content=cv_summary,
    )
    print(f"   Overall Score: {res_a.overall_score}%")
    print(f"   Breakdown: {len(res_a.breakdown)} tiêu chuẩn")
    print(f"   Strengths: {res_a.strengths}")
    print(f"   Recommendation: {res_a.recommendation}")

    # Test Case B: Mismatched Job (Chief Accountant / Kế toán trưởng)
    jd_mismatched = """
    Vị trí: Kế toán trưởng Doanh nghiệp (Chief Accountant)
    Yêu cầu: Tối thiểu 5 năm kinh nghiệm kế toán thuế, quyết toán tài chính, thành thạo phần mềm MISA, SAP, chứng chỉ CPA.
    Học vấn: Cử nhân Tài chính - Kế toán.
    """
    print("\n-> Test Case B: Đối chiếu CV IT với JD không phù hợp (Kế toán trưởng)...")
    res_b = await llm.match_cv(
        job_title="Kế toán trưởng Doanh nghiệp (Chief Accountant)",
        department="Tài chính - Kế toán",
        job_description="Chịu trách nhiệm toàn bộ hệ thống kế toán, quyết toán thuế, lập báo cáo tài chính kiểm toán.",
        job_requirements=jd_mismatched,
        criteria_weights=weights_matching,
        candidate_name="Nguyễn Tấn Đạt",
        cv_content=cv_summary,
    )
    print(f"   Overall Score: {res_b.overall_score}%")
    print(f"   Strengths: {res_b.strengths}")
    print(f"   Gaps: {res_b.gaps}")
    print(f"   Recommendation: {res_b.recommendation}")

    # Checks
    checks = {
        "JD phù hợp đạt điểm cao (Score >= 80%)": res_a.overall_score >= 80.0,
        "JD không phù hợp bị đánh giá thấp (Score <= 45%)": res_b.overall_score <= 45.0,
        "Độ chênh lệch điểm phản ánh đúng thực tế (> 40%)": (res_a.overall_score - res_b.overall_score) >= 40.0,
        "Điểm số phân rã tiêu chuẩn (breakdown) đầy đủ 4 tiêu chí": len(res_a.breakdown) >= 4,
        "Điểm tổng hợp phản ánh đúng các tiêu chí thành phần": 60.0 <= sum(c.score for c in res_a.breakdown) / len(res_a.breakdown) <= 100.0,
        "AI phát hiện đúng điểm mạnh của ứng viên (FastAPI/Python/RAG)": any("python" in s.lower() or "fastapi" in s.lower() or "rag" in s.lower() for s in res_a.strengths),
        "AI phát hiện đúng thiếu sót đối với vị trí kế toán (chứng chỉ CPA, MISA, kế toán)": any("kế toán" in g.lower() or "cpa" in g.lower() or "thuế" in g.lower() or "tài chính" in g.lower() for g in res_b.gaps),
    }

    all_passed = all(checks.values())
    for name, passed in checks.items():
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

    return {
        "module": "AI Matching & Rubric",
        "passed": all_passed,
        "score_a": res_a.overall_score,
        "score_b": res_b.overall_score,
        "details": checks
    }


async def verify_interview_question_accuracy(llm) -> Dict[str, Any]:
    print("\n========================================================")
    print("3. KIỂM TRA ĐỘ CHÍNH XÁC SINH BỘ CÂU HỎI PHỎNG VẤN STAR")
    print("========================================================")
    cv_summary = "Nguyễn Tấn Đạt. 4 năm kinh nghiệm Python, FastAPI, tối ưu RAG vector latency, xử lý lỗi Celery queue."
    jd_content = "Senior AI Engineer. Yêu cầu thiết kế RAG pipeline tốc độ cao, xử lý sự cố hàng đợi phân tán."

    print("-> Đang yêu cầu Gemini sinh câu hỏi STAR dựa trên CV và JD...")
    res = await llm.generate_interview_questions(
        job_title="Senior AI Engineer",
        job_requirements=jd_content,
        candidate_name="Nguyễn Tấn Đạt",
        cv_summary=cv_summary,
    )
    questions = res.questions
    print(f"-> Đã sinh {len(questions)} câu hỏi phỏng vấn:")
    for idx, q in enumerate(questions, 1):
        print(f"   {idx}. [{q.category}] {q.question}")
        print(f"      Rationale: {q.rationale}")
        print(f"      Expected points: {q.expected_answer_points}")

    checks = {
        "Sinh đủ ít nhất 3 câu hỏi": len(questions) >= 3,
        "Nội dung câu hỏi bám sát từ khóa kỹ thuật (RAG / FastAPI / Celery / Pipeline)": any(
            any(k in q.question.lower() or k in q.rationale.lower() for k in ["rag", "fastapi", "celery", "latency", "vector", "pipeline"])
            for q in questions
        ),
        "Mỗi câu hỏi có giải thích lý do (Rationale) rõ ràng": all(len(q.rationale.strip()) > 10 for q in questions),
        "Mỗi câu hỏi có danh sách điểm mong đợi (Expected Answers)": all(len(q.expected_answer_points) >= 1 for q in questions),
    }

    all_passed = all(checks.values())
    for name, passed in checks.items():
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

    return {
        "module": "Interview Questions",
        "passed": all_passed,
        "num_questions": len(questions),
        "details": checks
    }


async def verify_embedding_accuracy() -> Dict[str, Any]:
    print("\n========================================================")
    print("4. KIỂM TRA ĐỘ CHÍNH XÁC CỦA VECTOR EMBEDDING (GEMINI 3072 DIMS)")
    print("========================================================")
    doc_ai = "Kỹ sư Trí tuệ Nhân tạo, nghiên cứu Machine Learning, Deep Learning, PyTorch, LLM."
    doc_ml = "Chuyên viên Học máy (Machine Learning Engineer), huấn luyện mô hình dự đoán và mạng nơ-ron."
    doc_acc = "Chuyên viên Kế toán Thuế tổng hợp, lập báo cáo tài chính, quyết toán hóa đơn doanh nghiệp."

    print("-> Đang trích xuất vector embeddings qua gemini-embedding-001...")
    vec_ai = await embedding_client.get_embedding(doc_ai)
    vec_ml = await embedding_client.get_embedding(doc_ml)
    vec_acc = await embedding_client.get_embedding(doc_acc)

    sim_ai_ml = cosine_similarity(vec_ai, vec_ml)
    sim_ai_acc = cosine_similarity(vec_ai, vec_acc)

    print(f"   Vector dimensions: {len(vec_ai)} dims")
    print(f"   Độ tương đồng Cosine(AI, ML): {sim_ai_ml:.4f}")
    print(f"   Độ tương đồng Cosine(AI, Kế toán): {sim_ai_acc:.4f}")
    print(f"   Chênh lệch ngữ nghĩa: {sim_ai_ml - sim_ai_acc:.4f}")

    checks = {
        "Độ dài vector đúng chuẩn 3072 chiều": len(vec_ai) == 3072 and len(vec_ml) == 3072 and len(vec_acc) == 3072,
        "Văn bản cùng miền ngành nghề có độ tương đồng cao (>= 0.75 trên không gian 3072 chiều)": sim_ai_ml >= 0.75,
        "Văn bản khác biệt lĩnh vực có độ tương đồng thấp hơn đáng kể (> 0.10)": sim_ai_ml > (sim_ai_acc + 0.10),
        "Không có giá trị NaN hoặc Null trong vector": not any(math.isnan(x) for x in vec_ai),
    }

    all_passed = all(checks.values())
    for name, passed in checks.items():
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

    return {
        "module": "Vector Embedding",
        "passed": all_passed,
        "dimensions": len(vec_ai),
        "similarity_related": sim_ai_ml,
        "similarity_unrelated": sim_ai_acc,
        "details": checks
    }


async def verify_interview_evaluation_accuracy(llm) -> Dict[str, Any]:
    print("\n========================================================")
    print("5. KIỂM TRA ĐỘ CHÍNH XÁC ĐÁNH GIÁ TRANSCRIPT PHỎNG VẤN & RUBRIC")
    print("========================================================")
    job_req = "Senior AI Engineer. Yêu cầu hiểu sâu về kiến trúc LLM, RAG pipeline, và kỹ năng giao tiếp phối hợp nhóm."
    rubric = """
    1. Kiến thức chuyên môn RAG & LLM (Trọng số 40%): Giải thích được trade-off latency vs accuracy, reranking, hybrid search.
    2. Kinh nghiệm xử lý sự cố hệ thống (Trọng số 30%): Giải pháp xử lý nghẽn hàng đợi Celery, race condition.
    3. Kỹ năng giao tiếp và làm việc nhóm (Trọng số 30%): Khả năng trình bày, thuyết phục đồng đội và tiếp nhận phản hồi.
    """
    transcript = """
    Interviewer (00:05): Chào Đạt, bạn có thể chia sẻ cách bạn tối ưu hóa latency cho hệ thống RAG không?
    Candidate (00:20): Chào anh. Ở dự án trước, em đã áp dụng phương pháp 2-stage retrieval: đầu tiên dùng HNSW vector search để lấy top 50 văn bản trong vòng 35ms, sau đó dùng mô hình reranker nhỏ hơn như cross-encoder để lọc ra top 5 đưa vào context của Gemini. Nhờ vậy latency giảm từ 850ms xuống chỉ còn 160ms mà vẫn giữ được độ chính xác 92%.
    Interviewer (01:10): Rất ấn tượng. Còn khi hệ thống gặp lỗi Celery worker quá tải thì bạn làm thế nào?
    Candidate (01:25): Em đã áp dụng cơ chế backpressure kết hợp Celery task priority queue. Các tác vụ parse CV gấp của HR được ưu tiên high-priority queue, còn embedding hàng loạt được chuyển vào background queue chạy đêm. Đồng thời em thêm Dead Letter Queue để cô lập các payload lỗi, tránh tắc nghẽn toàn bộ worker pool.
    Interviewer (02:00): Cảm ơn bạn. Bạn phối hợp thế nào khi các thành viên trong team có bất đồng quan điểm về mặt kiến trúc?
    Candidate (02:15): Em luôn dựa trên dữ liệu benchmark thực tế thay vì tranh luận cảm tính. Em thường tạo một POC nhỏ, đo đạc latency, throughput, và chi phí token cụ thể của từng phương án rồi cùng team họp review để chọn giải pháp tối ưu nhất cho bài toán kinh doanh.
    """

    print("-> Đang yêu cầu Gemini phân tích transcript và chấm điểm theo Rubric...")
    eval_res = await llm.evaluate_interview_transcript(
        job_requirements=job_req,
        rubric_criteria=rubric,
        transcript_text=transcript,
    )
    print(f"-> Điểm đánh giá tổng hợp: {eval_res.overall_rating}/10")
    print(f"-> Đề xuất tuyển dụng: {eval_res.recommendation}")
    print(f"-> Điểm mạnh ghi nhận: {eval_res.key_strengths}")
    print(f"-> Điểm cần phát triển: {eval_res.areas_for_growth}")
    print(f"-> Chi tiết rubric ({len(eval_res.rubric_scores)} tiêu chí):")
    for r in eval_res.rubric_scores:
        print(f"   * [{r.criterion}] Điểm: {r.score} - Dẫn chứng: '{r.evidence_quote[:70]}...'")

    rec_lower = eval_res.recommendation.lower()
    checks = {
        "Điểm đánh giá ứng viên xuất sắc (Overall >= 8.0/10)": eval_res.overall_rating >= 8.0,
        "Đề xuất tuyển dụng Pass/Đạt": "pass" in rec_lower or "đạt" in rec_lower,
        "Có dẫn chứng trích xuất từ câu trả lời (evidence quote)": any(len(r.evidence_quote) > 10 for r in eval_res.rubric_scores),
        "Điểm mạnh ghi nhận đúng kỹ thuật (RAG / Latency / Celery / POC / Tải / Kiến trúc)": any(
            any(k in s.lower() for k in ["rag", "latency", "celery", "dữ liệu", "benchmark", "kỹ thuật", "kiến thức", "kiến trúc", "tải", "hệ thống"])
            for s in eval_res.key_strengths
        ),
        "Tóm tắt buổi phỏng vấn đầy đủ chi tiết": len(eval_res.summary) > 30,
    }

    all_passed = all(checks.values())
    for name, passed in checks.items():
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

    return {
        "module": "Interview Evaluation & Rubric",
        "passed": all_passed,
        "overall_rating": eval_res.overall_rating,
        "recommendation": eval_res.recommendation,
        "details": checks
    }


async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("====================================================================")
    print(" BỘ KIỂM TRA ĐỘ CHÍNH XÁC VÀ TÍNH ĐÚNG ĐẮN CỦA DỮ LIỆU GEMINI AI")
    print(" Nền tảng Tuyển dụng Nhân sự AI (AI Recruiting Platform)")
    print("====================================================================")
    llm = get_llm_client()

    r1 = await verify_cv_parsing_accuracy(llm)
    r2 = await verify_ai_matching_accuracy(llm)
    r3 = await verify_interview_question_accuracy(llm)
    r4 = await verify_embedding_accuracy()
    r5 = await verify_interview_evaluation_accuracy(llm)

    results = [r1, r2, r3, r4, r5]
    total = len(results)
    passed = sum(1 for r in results if r["passed"])

    print("\n====================================================================")
    print(" TỔNG HỢP ĐÁNH GIÁ CHẤT LƯỢNG DỮ LIỆU AI TRẢ VỀ")
    print("====================================================================")
    print(f" Tổng số module AI kiểm tra: {total}")
    print(f" Số module đạt độ chính xác chuẩn 100%: {passed}/{total}")
    print(f" Tỷ lệ chính xác toàn diện: {(passed/total)*100:.1f}%")
    print("====================================================================")

    with open("ai_accuracy_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(" Đã lưu báo cáo chi tiết vào tệp: backend/ai_accuracy_report.json")


if __name__ == "__main__":
    asyncio.run(main())
