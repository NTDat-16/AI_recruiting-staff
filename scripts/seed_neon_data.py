import os
import sys
import json
import uuid
import asyncio
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import asyncpg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

COMPANY_ID = "8bf5e60f-42d7-4580-b9cb-e2a2afbdad52" # AI Recruiting Demo Corp
HR_USER_ID = "0adce4d4-bb8b-4782-893c-3b3323862429" # demo.hr@recruiting.vn
DEFAULT_PWD_HASH = "$2b$12$hRPEkaetCGrdJ3.RfMp6/uUG4jn4JDuoi9JFBe8yVHxpu/LAb1/qO" # Demo123456@

async def seed_neon():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Lỗi: Không tìm thấy DATABASE_URL trong .env")
        return

    clean_url = db_url.split("?")[0]
    print(f"Đang kết nối tới Neon PostgreSQL: {clean_url[:45]}...")
    conn = await asyncpg.connect(clean_url, ssl="require")
    print("✓ Đã kết nối thành công tới Neon PostgreSQL!")

    now = datetime.now(timezone.utc)

    # 1. Thêm Interviewers (Người phỏng vấn kỹ thuật)
    interviewers = [
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "full_name": "Nguyễn Hoàng Nam",
            "email": "interviewer.nam@recruiting.vn",
            "hashed_password": DEFAULT_PWD_HASH,
            "role": "interviewer",
            "department": "AI Engineering",
            "is_active": True,
            "created_at": now - timedelta(days=20),
            "updated_at": now - timedelta(days=20),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "full_name": "Phan Minh Trí",
            "email": "interviewer.tri@recruiting.vn",
            "hashed_password": DEFAULT_PWD_HASH,
            "role": "interviewer",
            "department": "Product Development",
            "is_active": True,
            "created_at": now - timedelta(days=18),
            "updated_at": now - timedelta(days=18),
        }
    ]

    for inv in interviewers:
        existing = await conn.fetchval("SELECT id FROM users WHERE email = $1", inv["email"])
        if not existing:
            await conn.execute("""
                INSERT INTO users (id, company_id, full_name, email, hashed_password, role, department, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """, inv["id"], inv["company_id"], inv["full_name"], inv["email"], inv["hashed_password"],
            inv["role"], inv["department"], inv["is_active"], inv["created_at"], inv["updated_at"])
            print(f"✓ Đã thêm Interviewer: {inv['full_name']} ({inv['email']})")
        else:
            inv["id"] = existing
            print(f"ℹ Interviewer đã tồn tại: {inv['full_name']} ({inv['email']})")

    interviewer_nam_id = interviewers[0]["id"]
    interviewer_tri_id = interviewers[1]["id"]

    # 2. Thêm Job Postings mới
    new_jobs = [
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "AI Research Scientist & LLM Specialist",
            "slug": "ai-research-scientist-llm-specialist",
            "department": "AI Engineering",
            "location": "Hà Nội / Hybrid",
            "salary_range": "45,000,000 - 70,000,000 VND",
            "description": "Chịu trách nhiệm nghiên cứu, tối ưu hóa các mô hình ngôn ngữ lớn (LLMs), thiết kế kiến trúc RAG cấp doanh nghiệp, tinh chỉnh mô hình (Fine-tuning) và nhúng vector embeddings trên hệ CSDL pgvector quy mô lớn.",
            "requirements": "Ít nhất 3 năm kinh nghiệm thực chiến với PyTorch, Transformers (Hugging Face); Am hiểu sâu về RAG, Vector Search, Prompt Engineering nâng cao; Ưu tiên ứng viên có bằng Thạc sĩ/Tiến sĩ ngành Khoa học Máy tính hoặc Trí tuệ Nhân tạo.",
            "ai_criteria_weights": json.dumps({"ai_knowledge": 0.35, "problem_solving": 0.25, "coding_pytorch": 0.25, "communication": 0.15}),
            "status": "published",
            "deadline": now + timedelta(days=30),
            "view_count": "685",
            "created_at": now - timedelta(days=12),
            "updated_at": now - timedelta(days=12),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "Product Manager (AI & HR Tech SaaS)",
            "slug": "product-manager-ai-hr-tech-saas",
            "department": "Product & Growth",
            "location": "TP. Hồ Chí Minh / Hybrid",
            "salary_range": "35,000,000 - 52,000,000 VND",
            "description": "Dẫn dắt lộ trình phát triển (Product Roadmap) cho nền tảng ATS ứng dụng AI; làm việc trực tiếp với đội ngũ AI Engineers, Designers và Khách hàng Doanh nghiệp để định nghĩa tính năng và tối ưu hóa chuyển đổi tuyển dụng.",
            "requirements": "Tối thiểu 3 năm kinh nghiệm làm Product Manager trong mảng B2B SaaS hoặc HR-Tech; Tư duy hướng dữ liệu (Data-driven); Khả năng viết PRD, User Story và phối hợp Agile/Scrum xuất sắc.",
            "ai_criteria_weights": json.dumps({"product_sense": 0.35, "domain_hr_ats": 0.25, "data_analytics": 0.20, "stakeholder_management": 0.20}),
            "status": "published",
            "deadline": now + timedelta(days=25),
            "view_count": "540",
            "created_at": now - timedelta(days=10),
            "updated_at": now - timedelta(days=10),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "Senior Data Engineer & MLOps Lead",
            "slug": "senior-data-engineer-mlops-lead",
            "department": "Infrastructure & Platform",
            "location": "Đà Nẵng / Remote",
            "salary_range": "40,000,000 - 65,000,000 VND",
            "description": "Xây dựng và vận hành pipeline dữ liệu lớn phục vụ huấn luyện và suy luận AI; thiết lập cụm Kubernetes, Kafka streaming và tự động hóa CI/CD cho các mô hình AI phục vụ hàng triệu request mỗi ngày.",
            "requirements": "4+ năm kinh nghiệm Data Engineering / MLOps; Thành thạo Kafka, Spark, PostgreSQL/pgvector, Docker, Kubernetes; Có kinh nghiệm triển khai cụm Redis và Celery worker chịu tải cao.",
            "ai_criteria_weights": json.dumps({"mlops_pipeline": 0.35, "kubernetes_docker": 0.30, "db_optimization": 0.20, "collaboration": 0.15}),
            "status": "published",
            "deadline": now + timedelta(days=20),
            "view_count": "420",
            "created_at": now - timedelta(days=8),
            "updated_at": now - timedelta(days=8),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "Senior UI/UX Product Designer",
            "slug": "senior-ui-ux-product-designer",
            "department": "Product Development",
            "location": "TP. Hồ Chí Minh",
            "salary_range": "28,000,000 - 45,000,000 VND",
            "description": "Thiết kế trải nghiệm người dùng toàn diện cho cả Cổng Nhà tuyển dụng (Employer Dashboard) và Cổng Việc làm Công khai; xây dựng Design System tinh gọn, hiện đại và thân thiện với AI Copilot.",
            "requirements": "3+ năm kinh nghiệm thiết kế UI/UX ứng dụng Web/Dashboard SaaS phức tạp; Sử dụng thành thạo Figma, Design Tokens, Prototype; Tư duy sản phẩm tốt, lấy người dùng làm trung tâm.",
            "ai_criteria_weights": json.dumps({"ui_ux_portfolio": 0.40, "design_system": 0.25, "user_empathy": 0.20, "collaboration": 0.15}),
            "status": "published",
            "deadline": now + timedelta(days=35),
            "view_count": "380",
            "created_at": now - timedelta(days=7),
            "updated_at": now - timedelta(days=7),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "Senior QA Automation & Security Tester",
            "slug": "senior-qa-automation-security-tester",
            "department": "Quality Assurance",
            "location": "Hà Nội",
            "salary_range": "26,000,000 - 42,000,000 VND",
            "description": "Thiết kế và thực thi kịch bản kiểm thử tự động toàn diện (E2E, API, Regression, Security, Load Testing) cho cả Backend FastAPI và Frontend Next.js; đảm bảo tính toàn vẹn và bảo mật dữ liệu đa công ty (Multi-tenant).",
            "requirements": "3+ năm kinh nghiệm QA Automation; Thành thạo Playwright / Selenium, Pytest, Postman; Có kinh nghiệm kiểm thử tải Locust / k6 và bảo mật OWASP Top 10.",
            "ai_criteria_weights": json.dumps({"automation_testing": 0.40, "security_api": 0.25, "cicd_integration": 0.20, "bug_reporting": 0.15}),
            "status": "published",
            "deadline": now + timedelta(days=28),
            "view_count": "310",
            "created_at": now - timedelta(days=5),
            "updated_at": now - timedelta(days=5),
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": COMPANY_ID,
            "created_by_id": HR_USER_ID,
            "title": "AI Talent Acquisition Lead",
            "slug": "ai-talent-acquisition-lead",
            "department": "Human Resources",
            "location": "Hà Nội / TP. HCM",
            "salary_range": "30,000,000 - 48,000,000 VND",
            "description": "Xây dựng chiến lược tìm kiếm và thu hút nhân tài cấp cao trong lĩnh vực AI & Công nghệ thông tin; ứng dụng AI Talent Pool và mạng lưới tuyển dụng để tuyển mộ các chuyên gia đầu ngành.",
            "requirements": "4+ năm kinh nghiệm tuyển dụng Tech/AI; Am hiểu sâu thị trường nhân sự IT Việt Nam & Đông Nam Á; Kỹ năng đàm phán, giao tiếp và kết nối nhân tài xuất sắc.",
            "ai_criteria_weights": json.dumps({"tech_sourcing": 0.40, "interviewing": 0.25, "market_insight": 0.20, "negotiation": 0.15}),
            "status": "draft",
            "deadline": now + timedelta(days=40),
            "view_count": "45",
            "created_at": now - timedelta(days=2),
            "updated_at": now - timedelta(days=2),
        }
    ]

    job_id_map = {}
    for j in new_jobs:
        existing = await conn.fetchval("SELECT id FROM job_postings WHERE slug = $1 AND company_id = $2", j["slug"], COMPANY_ID)
        if not existing:
            await conn.execute("""
                INSERT INTO job_postings (id, company_id, created_by_id, title, slug, department, location, salary_range, description, requirements, ai_criteria_weights, status, deadline, view_count, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            """, j["id"], j["company_id"], j["created_by_id"], j["title"], j["slug"], j["department"], j["location"], j["salary_range"], j["description"], j["requirements"], j["ai_criteria_weights"], j["status"], j["deadline"], j["view_count"], j["created_at"], j["updated_at"])
            job_id_map[j["slug"]] = j["id"]
            print(f"✓ Đã thêm Job mới: {j['title']} (Trạng thái: {j['status']})")
        else:
            job_id_map[j["slug"]] = existing
            print(f"ℹ Job đã có sẵn: {j['title']}")

    # Lấy thêm các job cũ để liên kết
    old_python_job = await conn.fetchval("SELECT id FROM job_postings WHERE company_id = $1 AND title ILIKE '%Python%' LIMIT 1", COMPANY_ID)
    old_frontend_job = await conn.fetchval("SELECT id FROM job_postings WHERE company_id = $1 AND title ILIKE '%Frontend Next.js%' LIMIT 1", COMPANY_ID)
    old_devops_job = await conn.fetchval("SELECT id FROM job_postings WHERE company_id = $1 AND title ILIKE '%DevOps%' LIMIT 1", COMPANY_ID)

    job_ai_scientist = job_id_map.get("ai-research-scientist-llm-specialist", old_python_job)
    job_pm = job_id_map.get("product-manager-ai-hr-tech-saas", old_python_job)
    job_mlops = job_id_map.get("senior-data-engineer-mlops-lead", old_devops_job)
    job_uiux = job_id_map.get("senior-ui-ux-product-designer", old_frontend_job)
    job_qa = job_id_map.get("senior-qa-automation-security-tester", old_devops_job)

    # 3. Thêm Candidates (Hồ sơ ứng viên chuyên sâu)
    new_candidates_data = [
        {
            "full_name": "Lê Thanh Tùng",
            "email": "tung.lethanh.ai@gmail.com",
            "phone": "0982345678",
            "job_id": old_python_job,
            "status": "interview_invited",
            "match_score": 94.5,
            "rating": 4.8,
            "source": "linkedin",
            "tags": ["Python", "FastAPI", "Next.js", "Docker", "LangChain", "PostgreSQL"],
            "years_exp": 5.0,
            "raw_text": "Lê Thanh Tùng - Senior Fullstack AI Engineer. 5 năm kinh nghiệm xây dựng hệ thống web ứng dụng AI quy mô lớn. Từng làm việc tại FPT Software và VinAI. Thành thạo Python, FastAPI, React/Next.js, pgvector, LangChain. Tốt nghiệp ĐH Bách Khoa Hà Nội loại Giỏi.",
            "strong_matches": ["5 năm kinh nghiệm vững chắc với Python FastAPI và Next.js", "Đã trực tiếp triển khai hệ thống RAG và vector embeddings cho 100k người dùng", "Kiến thức xuất sắc về thiết kế hệ thống Microservices và Docker container"],
            "missing_evidence": ["Cần phỏng vấn thêm về kinh nghiệm tối ưu hóa chi phí token LLM quy mô lớn"],
            "recommendation": "strongly_hire",
            "hr_notes": "Ứng viên rất sáng giá, CV ấn tượng, phù hợp hoàn hảo với văn hóa công ty. Đã mời phỏng vấn kỹ thuật.",
            "avatar_url": "/storage/avatars/ae4149ae-0cb3-48b4-907b-2f138104ecc0_avatar.jpg"
        },
        {
            "full_name": "Đỗ Quỳnh Anh",
            "email": "quynhanh.do.research@gmail.com",
            "phone": "0918765432",
            "job_id": job_ai_scientist,
            "status": "interview_invited",
            "match_score": 96.0,
            "rating": 4.9,
            "source": "referral",
            "tags": ["PyTorch", "LLM", "Fine-tuning", "RAG", "NLP", "Transformers"],
            "years_exp": 4.5,
            "raw_text": "Đỗ Quỳnh Anh - Thạc sĩ Khoa học Máy tính Đại học Quốc gia. 4.5 năm nghiên cứu và ứng dụng NLP/LLMs. Đã có 2 bài báo quốc tế tại hội nghị ACL và EMNLP về cơ chế chú ý và tối ưu hóa embedding. Thành thạo PyTorch, Hugging Face, vLLM, DeepSpeed.",
            "strong_matches": ["Có bài báo khoa học quốc tế uy tín về NLP và LLM", "Thực chiến sâu rộng với PyTorch, Hugging Face và tối ưu hóa mô hình suy luận", "Kỹ năng tư duy thuật toán và giải quyết bài toán phức tạp xuất sắc"],
            "missing_evidence": ["Kinh nghiệm triển khai Production API ở mức vừa phải, chủ yếu chuyên sâu R&D"],
            "recommendation": "strongly_hire",
            "hr_notes": "Ứng viên top-tier về mặt nghiên cứu và học thuật. Phỏng vấn viên Nam sẽ phụ trách đánh giá chuyên sâu.",
            "avatar_url": None
        },
        {
            "full_name": "Trần Gia Bảo",
            "email": "giabao.tran.mlops@cloudtech.vn",
            "phone": "0903456789",
            "job_id": job_mlops,
            "status": "interviewed",
            "match_score": 92.0,
            "rating": 4.7,
            "source": "topcv",
            "tags": ["Kubernetes", "Kafka", "MLflow", "Docker", "AWS", "Spark"],
            "years_exp": 6.0,
            "raw_text": "Trần Gia Bảo - Lead MLOps & Data Engineer. 6 năm kinh nghiệm thiết lập hạ tầng Cloud Kubernetes trên AWS, xây dựng Kafka pipeline xử lý 10 triệu message/ngày. Từng giữ vị trí Tech Lead tại VNG và Zalo.",
            "strong_matches": ["6 năm kinh nghiệm dẫn dắt hạ tầng Cloud & Big Data chịu tải lớn", "Thành thạo cụm Kubernetes, Kafka và CI/CD automated deployments", "Nắm rất vững về tối ưu hóa chi phí hạ tầng AWS"],
            "missing_evidence": ["Cần kiểm tra kỹ về tính năng Vector Database mới như pgvector"],
            "recommendation": "hire",
            "hr_notes": "Buổi phỏng vấn diễn ra rất tốt. Đạt 9.2 điểm từ hội đồng đánh giá.",
            "avatar_url": None
        },
        {
            "full_name": "Ngô Thu Trang",
            "email": "thutrang.ngo.pm@outlook.com",
            "phone": "0934567890",
            "job_id": job_pm,
            "status": "interview_invited",
            "match_score": 89.5,
            "rating": 4.8,
            "source": "linkedin",
            "tags": ["Product Management", "SaaS", "ATS", "Agile", "User Research", "Data Analytics"],
            "years_exp": 5.0,
            "raw_text": "Ngô Thu Trang - Senior Product Manager. 5 năm kinh nghiệm dẫn dắt sản phẩm B2B SaaS trong lĩnh vực quản trị nhân sự và tuyển dụng. Từng làm việc tại Base.vn và TopCV. Thành thạo xây dựng PRD, phân tích dữ liệu Amplitude, Mixpanel và dẫn dắt đội ngũ 15 engineers.",
            "strong_matches": ["Am hiểu sâu sắc nghiệp vụ tuyển dụng và các tính năng cốt lõi của ATS", "Kinh nghiệm thực chiến 5 năm tại các công ty SaaS hàng đầu Việt Nam", "Kỹ năng giao tiếp và thuyết phục các bên liên quan xuất sắc"],
            "missing_evidence": ["Cần kiểm tra tư duy áp dụng Generative AI trong việc tự động hóa tác vụ tuyển dụng"],
            "recommendation": "hire",
            "hr_notes": "Hồ sơ rất khớp với định hướng phát triển sản phẩm của công ty.",
            "avatar_url": None
        },
        {
            "full_name": "Bùi Minh Khoa",
            "email": "khoa.bui.designer@creativelab.io",
            "phone": "0978901234",
            "job_id": job_uiux,
            "status": "interviewed",
            "match_score": 91.0,
            "rating": 4.6,
            "source": "career_site",
            "tags": ["Figma", "UI/UX", "Design System", "Dashboard", "Prototyping", "Tailwind CSS"],
            "years_exp": 4.0,
            "raw_text": "Bùi Minh Khoa - Senior UI/UX Designer. 4 năm kinh nghiệm thiết kế giao diện ứng dụng Enterprise Dashboard. Tác giả của Design System phục vụ 5 dự án SaaS lớn. Nắm vững nguyên tắc Atomic Design, Micro-interactions và hiểu biết tốt về HTML/Tailwind CSS.",
            "strong_matches": ["Portfolio thiết kế Dashboard cực kỳ chuyên nghiệp, hiện đại", "Xây dựng Design System bài bản, có khả năng bàn giao code cho Frontend mượt mà", "Tư duy tinh gọn, ưu tiên trải nghiệm người dùng thực tế"],
            "missing_evidence": ["Kinh nghiệm nghiên cứu định lượng người dùng (quantitative research) còn ít"],
            "recommendation": "hire",
            "hr_notes": "Buổi phỏng vấn kỹ thuật thành công, phỏng vấn viên Trí đánh giá cao tư duy thiết kế.",
            "avatar_url": None
        },
        {
            "full_name": "Vũ Hoàng Long",
            "email": "long.vu.qa@qualityfirst.vn",
            "phone": "0965432109",
            "job_id": job_qa,
            "status": "offered",
            "match_score": 93.0,
            "rating": 4.7,
            "source": "referral",
            "tags": ["Playwright", "Pytest", "Automation Test", "Security", "CI/CD", "Load Testing"],
            "years_exp": 5.0,
            "raw_text": "Vũ Hoàng Long - Lead QA Automation Engineer. 5 năm kinh nghiệm xây dựng framework kiểm thử tự động với Playwright và Pytest. Có kinh nghiệm kiểm thử bảo mật API, kiểm thử đa người thuê (Multi-tenant) và tích hợp pipeline CI/CD GitHub Actions.",
            "strong_matches": ["Xây dựng thành thạo framework automation testing từ con số 0 với Playwright", "Nắm chắc kỹ năng kiểm thử bảo mật API và cách ly dữ liệu Multi-tenant", "Tác phong làm việc chuyên nghiệp, cẩn trọng"],
            "missing_evidence": ["Không có điểm thiếu hụt đáng kể so với yêu cầu tuyển dụng"],
            "recommendation": "strongly_hire",
            "hr_notes": "Đã hoàn thành xuất sắc 2 vòng phỏng vấn. Đã phát hành Thư mời nhận việc (Offer Letter).",
            "avatar_url": None
        },
        {
            "full_name": "Phạm Quang Huy",
            "email": "huy.quangpham@backendtech.com",
            "phone": "0945678901",
            "job_id": old_python_job,
            "status": "offered",
            "match_score": 90.5,
            "rating": 4.5,
            "source": "topcv",
            "tags": ["Python", "FastAPI", "Golang", "PostgreSQL", "Redis", "Docker"],
            "years_exp": 5.0,
            "raw_text": "Phạm Quang Huy - Senior Backend Engineer. 5 năm kinh nghiệm backend với Python FastAPI và Golang. Từng thiết kế hệ thống thanh toán và cổng xác thực phục vụ hàng trăm ngàn giao dịch mỗi ngày. Tốt nghiệp ĐH Công nghệ ĐHQGHN.",
            "strong_matches": ["Kiến thức sâu rộng về tối ưu hóa truy vấn PostgreSQL và Redis Caching", "Kinh nghiệm thực chiến với hệ thống thanh toán có tính toàn vẹn cao", "Thành thạo viết Unit test và Integration test tự động"],
            "missing_evidence": ["Ít kinh nghiệm với việc tích hợp các mô hình ngôn ngữ lớn (LLMs)"],
            "recommendation": "hire",
            "hr_notes": "Đã gửi thư mời nhận việc với mức đãi ngộ hấp dẫn. Ứng viên đang cân nhắc.",
            "avatar_url": None
        },
        {
            "full_name": "Trịnh Quốc Việt",
            "email": "viet.trinhquoc.lead@enterprise.vn",
            "phone": "0912345670",
            "job_id": old_devops_job,
            "status": "hired",
            "match_score": 95.0,
            "rating": 4.9,
            "source": "referral",
            "tags": ["DevOps", "AWS", "Terraform", "Kubernetes", "Linux", "Security"],
            "years_exp": 7.0,
            "raw_text": "Trịnh Quốc Việt - Principal Cloud & DevOps Architect. 7 năm kinh nghiệm thiết kế hạ tầng Enterprise trên AWS và Google Cloud. Sở hữu chứng chỉ AWS Solutions Architect Professional và CKA (Certified Kubernetes Administrator).",
            "strong_matches": ["Sở hữu chứng chỉ quốc tế đỉnh cao: AWS SA Pro và CKA", "7 năm kinh nghiệm kiến trúc hạ tầng đám mây cho các ngân hàng và tập đoàn tài chính", "Kỹ năng lãnh đạo và định hướng kỹ thuật xuất sắc"],
            "missing_evidence": ["Không có"],
            "recommendation": "strongly_hire",
            "hr_notes": "ĐÃ TIẾP NHẬN THÀNH CÔNG! Ngày bắt đầu làm việc chính thức: 15/10/2026.",
            "avatar_url": None
        },
        {
            "full_name": "Lý Mỹ Linh",
            "email": "linh.ly.frontend@gmail.com",
            "phone": "0923456781",
            "job_id": old_frontend_job,
            "status": "reviewing",
            "match_score": 87.0,
            "rating": 4.4,
            "source": "career_site",
            "tags": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Zustand"],
            "years_exp": 3.5,
            "raw_text": "Lý Mỹ Linh - Frontend Developer. 3.5 năm kinh nghiệm phát triển Single Page Apps và Next.js App Router. Thành thạo TypeScript, React 18/19, Tailwind CSS, Zustand, React Query. Có kinh nghiệm tối ưu hóa Web Vitals và SEO on-page.",
            "strong_matches": ["Kỹ năng lập trình TypeScript và Next.js rất vững", "Giao diện xây dựng có tính thẩm mỹ cao, chuẩn responsive", "Đã từng xây dựng Kanban Board kéo thả mượt mà"],
            "missing_evidence": ["Cần kiểm tra sâu hơn về Server Components và cơ chế Streaming SSR"],
            "recommendation": "consider",
            "hr_notes": "Hồ sơ ổn, HR đang rà soát kỹ năng và dự kiến mời phỏng vấn trong tuần này.",
            "avatar_url": None
        },
        {
            "full_name": "Cao Tuấn Kiệt",
            "email": "tuankiet.cao.ds@analytics.vn",
            "phone": "0934567812",
            "job_id": job_ai_scientist,
            "status": "reviewing",
            "match_score": 85.5,
            "rating": 4.5,
            "source": "linkedin",
            "tags": ["Data Science", "Python", "Machine Learning", "SQL", "Scikit-Learn", "BigQuery"],
            "years_exp": 4.0,
            "raw_text": "Cao Tuấn Kiệt - Senior Data Scientist. 4 năm kinh nghiệm phân tích dữ liệu và xây dựng mô hình dự báo kinh doanh. Thành thạo Python, SQL, BigQuery, Scikit-Learn, XGBoost, Pandas. Đang mở rộng chuyên môn sang Generative AI và Prompt Tuning.",
            "strong_matches": ["Nền tảng toán học và xác suất thống kê rất vững", "Khả năng xử lý và làm sạch dữ liệu lớn cực tốt với SQL và BigQuery"],
            "missing_evidence": ["Kinh nghiệm về LLMs và RAG chủ yếu là tự học và làm pet projects"],
            "recommendation": "consider",
            "hr_notes": "Cần xem xét bố trí vào vị trí Data Scientist hoặc kết hợp đào tạo thêm về LLMs.",
            "avatar_url": None
        },
        {
            "full_name": "Đinh Tuyết Mai",
            "email": "tuyetmai.dinh.ai@gmail.com",
            "phone": "0945678123",
            "job_id": job_ai_scientist,
            "status": "new",
            "match_score": 82.0,
            "rating": 4.3,
            "source": "career_site",
            "tags": ["Python", "Computer Vision", "OpenCV", "PyTorch", "FastAPI"],
            "years_exp": 3.0,
            "raw_text": "Đinh Tuyết Mai - AI Developer chuyên ngành Thị giác máy tính (Computer Vision). 3 năm kinh nghiệm xử lý ảnh y tế và nhận diện vật thể với YOLO, OpenCV, PyTorch. Tốt nghiệp ĐH Bách Khoa TP. HCM.",
            "strong_matches": ["Kỹ năng lập trình Python và kiến thức Computer Vision vững chắc", "Đã từng phát triển API xử lý hình ảnh thời gian thực với FastAPI"],
            "missing_evidence": ["Yêu cầu công việc hiện tại ưu tiên NLP và LLMs hơn Computer Vision"],
            "recommendation": "consider",
            "hr_notes": "Hồ sơ mới nộp, điểm mạnh về CV nhưng Job cần NLP. Cân nhắc giữ hồ sơ trong Talent Pool.",
            "avatar_url": None
        },
        {
            "full_name": "Nguyễn Thùy Dương",
            "email": "duong.nguyenthuy@techuni.edu.vn",
            "phone": "0956781234",
            "job_id": old_python_job,
            "status": "new",
            "match_score": 79.5,
            "rating": 4.1,
            "source": "career_site",
            "tags": ["Python", "FastAPI", "Gemini API", "Pandas", "Git"],
            "years_exp": 1.5,
            "raw_text": "Nguyễn Thùy Dương - Junior AI Developer. 1.5 năm kinh nghiệm. Tốt nghiệp loại Xuất sắc khoa CNTT ĐH Công nghệ. Đã tự phát triển ứng dụng Chatbot hỗ trợ học tập tích hợp Gemini API và FastAPI.",
            "strong_matches": ["Năng động, tiếp thu công nghệ mới cực nhanh", "Đã có sản phẩm thực tế tích hợp Gemini API", "Điểm học tập đại học xuất sắc"],
            "missing_evidence": ["Số năm kinh nghiệm chưa đủ tiêu chuẩn Senior (yêu cầu 4+ năm)"],
            "recommendation": "consider",
            "hr_notes": "Hồ sơ tiềm năng cho vị trí Junior/Mid trong tương lai.",
            "avatar_url": None
        },
        {
            "full_name": "Hà Ngọc Hân",
            "email": "ngochan.ha.hr@talentlink.vn",
            "phone": "0967812345",
            "job_id": job_id_map.get("ai-talent-acquisition-lead", old_python_job),
            "status": "new",
            "match_score": 88.0,
            "rating": 4.2,
            "source": "referral",
            "tags": ["Tech Sourcing", "Talent Pool", "Recruitment", "Headhunting", "LinkedIn"],
            "years_exp": 3.5,
            "raw_text": "Hà Ngọc Hân - Tech Recruiter. 3.5 năm kinh nghiệm tuyển dụng các vị trí kỹ sư phần mềm và AI tại thị trường Đông Nam Á. Sử dụng thành thạo các công cụ sourcing hiện đại và hệ thống ATS.",
            "strong_matches": ["Kỹ năng sourcing ứng viên kỹ thuật công nghệ cao rất tốt", "Mạng lưới quan hệ rộng trong cộng đồng developer"],
            "missing_evidence": ["Chưa có nhiều kinh nghiệm quản lý đội ngũ tuyển dụng lớn"],
            "recommendation": "hire",
            "hr_notes": "Hồ sơ phù hợp cho vị trí Talent Acquisition khi mở rộng quy mô.",
            "avatar_url": None
        },
        {
            "full_name": "Phan Văn Đạt",
            "email": "dat.phanvan.ops@systeminfra.vn",
            "phone": "0978123456",
            "job_id": job_mlops,
            "status": "interviewed",
            "match_score": 86.5,
            "rating": 4.4,
            "source": "topcv",
            "tags": ["DevOps", "Docker", "CI/CD", "Prometheus", "Grafana", "Linux"],
            "years_exp": 3.5,
            "raw_text": "Phan Văn Đạt - DevOps Engineer. 3.5 năm kinh nghiệm triển khai giám sát hệ thống với Prometheus, Grafana, ELK Stack. Tự động hóa CI/CD với GitLab CI và Docker Swarm.",
            "strong_matches": ["Kỹ năng monitoring và observability rất tốt", "Kinh nghiệm thực chiến về quản trị Linux và Docker"],
            "missing_evidence": ["Kinh nghiệm thực tế về cụm Kubernetes quy mô lớn chưa nhiều"],
            "recommendation": "consider",
            "hr_notes": "Đã phỏng vấn vòng 1, ứng viên nhiệt tình, mong muốn học hỏi thêm về Kubernetes.",
            "avatar_url": None
        }
    ]

    candidate_records = []
    application_records = []

    for c in new_candidates_data:
        cand_id = str(uuid.uuid4())
        app_id = str(uuid.uuid4())

        existing_c = await conn.fetchval("SELECT id FROM candidates WHERE email = $1 AND company_id = $2", c["email"], COMPANY_ID)
        if existing_c:
            cand_id = existing_c
            print(f"ℹ Ứng viên đã có sẵn: {c['full_name']} ({c['email']})")
        else:
            parsed_data = {
                "full_name": c["full_name"],
                "email": c["email"],
                "phone": c["phone"],
                "skills": c["tags"],
                "total_experience_years": c["years_exp"],
                "education": [{"institution": "Đại học Bách Khoa / ĐHQG", "degree": "Cử nhân / Thạc sĩ", "field_of_study": "Khoa học Máy tính", "graduation_year": 2021}],
                "experience": [{"company": "Tech Enterprise VN", "position": c["tags"][0] + " Specialist", "years": c["years_exp"], "highlights": c["raw_text"][:100]}],
                "certifications": ["AWS / Professional Certified", "AI Specialist"]
            }

            await conn.execute("""
                INSERT INTO candidates (id, company_id, full_name, email, phone, avatar_url, raw_text, parsed_data, source, tags, hr_notes, rating, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, cand_id, COMPANY_ID, c["full_name"], c["email"], c["phone"], c["avatar_url"], c["raw_text"],
            json.dumps(parsed_data), c["source"], json.dumps(c["tags"]), c["hr_notes"], c["rating"],
            now - timedelta(days=6), now - timedelta(days=6))
            print(f"✓ Đã thêm Ứng viên: {c['full_name']} ({c['email']})")

        # Thêm Application
        existing_app = await conn.fetchval("SELECT id FROM applications WHERE candidate_id = $1 AND job_posting_id = $2", cand_id, c["job_id"])
        if existing_app:
            app_id = existing_app
        else:
            score_breakdown = {
                "overall_score": c["match_score"],
                "criteria_scores": {
                    "Chuyên môn kỹ thuật": c["match_score"] + 2 if c["match_score"] < 98 else 98,
                    "Kinh nghiệm thực chiến": c["match_score"] - 1,
                    "Tư duy kiến trúc hệ thống": c["match_score"] + 1 if c["match_score"] < 99 else 99,
                    "Kỹ năng mềm & Văn hóa": 90.0
                },
                "strong_matches": c["strong_matches"],
                "missing_evidence": c["missing_evidence"],
                "recommendation": c["recommendation"]
            }

            await conn.execute("""
                INSERT INTO applications (id, job_posting_id, candidate_id, match_score, score_breakdown, status, hr_feedback, hr_notes, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """, app_id, c["job_id"], cand_id, c["match_score"], json.dumps(score_breakdown), c["status"],
            json.dumps({"stage": c["status"], "evaluator": "HR Team"}), c["hr_notes"],
            now - timedelta(days=5), now - timedelta(days=1))
            print(f"  -> Tạo Application cho {c['full_name']} (Trạng thái: {c['status']}, Match: {c['match_score']}%)")

        c["cand_id"] = cand_id
        c["app_id"] = app_id

    # 4. Thêm Interviews & Evaluations
    tung = next(c for c in new_candidates_data if c["full_name"] == "Lê Thanh Tùng")
    quynhanh = next(c for c in new_candidates_data if c["full_name"] == "Đỗ Quỳnh Anh")
    trang = next(c for c in new_candidates_data if c["full_name"] == "Ngô Thu Trang")
    bao = next(c for c in new_candidates_data if c["full_name"] == "Trần Gia Bảo")
    khoa = next(c for c in new_candidates_data if c["full_name"] == "Bùi Minh Khoa")

    interviews_to_seed = [
        {
            "application_id": tung["app_id"],
            "interviewer_id": interviewer_nam_id,
            "title": "Phỏng vấn Kỹ thuật Chuyên sâu AI - Lê Thanh Tùng",
            "round_number": 1,
            "scheduled_time": now + timedelta(days=2, hours=4), # 2 ngày tới
            "duration_minutes": 60,
            "format": "online",
            "meeting_link": "https://meet.google.com/rec-ai-tung-2026",
            "confirmation_status": "confirmed",
            "questions": [
                "Anh hãy trình bày kiến trúc triển khai hệ thống RAG tối ưu độ trễ dưới 500ms khi người dùng hỏi tài liệu lớn?",
                "Kinh nghiệm xử lý bất đồng bộ trong FastAPI và cách khắc phục blocking event loop?",
                "Làm thế nào để đo lường độ chính xác (Precision/Recall) của kết quả đối soát CV bằng AI?"
            ]
        },
        {
            "application_id": quynhanh["app_id"],
            "interviewer_id": interviewer_nam_id,
            "title": "Phỏng vấn Đánh giá R&D và Tối ưu Model - Đỗ Quỳnh Anh",
            "round_number": 1,
            "scheduled_time": now + timedelta(days=3, hours=2), # 3 ngày tới
            "duration_minutes": 60,
            "format": "online",
            "meeting_link": "https://meet.google.com/rec-ai-quynhanh-2026",
            "confirmation_status": "confirmed",
            "questions": [
                "Chị so sánh ưu/nhược điểm giữa việc Fine-tuning mô hình nhỏ với Prompt Engineering trên LLMs lớn?",
                "Phương pháp lập chỉ mục HNSW trong pgvector và cách tinh chỉnh ef_search để đạt độ tương đồng cao?",
                "Kinh nghiệm xử lý hiện tượng Hallucination khi triển khai GenAI cho nghiệp vụ tuyển dụng?"
            ]
        },
        {
            "application_id": trang["app_id"],
            "interviewer_id": HR_USER_ID,
            "title": "Phỏng vấn Quản trị Sản phẩm SaaS Tuyển Dụng - Ngô Thu Trang",
            "round_number": 1,
            "scheduled_time": now + timedelta(days=4, hours=3), # 4 ngày tới
            "duration_minutes": 45,
            "format": "online",
            "meeting_link": "https://meet.google.com/rec-pm-trang-2026",
            "confirmation_status": "pending",
            "questions": [
                "Làm sao để cân bằng giữa tính năng tự động hóa bằng AI và kiểm soát đạo đức (Ethical AI) trong tuyển dụng?",
                "Số liệu đo lường thành công chính (North Star Metric) của một nền tảng ATS thông minh là gì?"
            ]
        },
        {
            "application_id": bao["app_id"],
            "interviewer_id": interviewer_nam_id,
            "title": "Phỏng vấn Kiến trúc MLOps & Big Data - Trần Gia Bảo",
            "round_number": 1,
            "scheduled_time": now - timedelta(days=2, hours=3), # 2 ngày trước (Đã hoàn thành)
            "duration_minutes": 60,
            "format": "online",
            "meeting_link": "https://meet.google.com/rec-mlops-bao-2026",
            "confirmation_status": "completed",
            "questions": ["Kiến trúc cụm Kubernetes phục vụ AI inference", "Chiến lược phân vùng Kafka"],
            "eval": {
                "manual_score": 9.2,
                "manual_rubric_scores": {"Kiến trúc hệ thống": 9.5, "Kubernetes/Docker": 9.0, "Giải quyết vấn đề": 9.5, "Giao tiếp": 8.8},
                "manual_notes": "Ứng viên nắm rất sâu kiến trúc Kubernetes trên AWS, giải thích rành mạch cách tối ưu chi phí GPU compute.",
                "ai_rating": 9.1,
                "ai_summary": "Ứng viên thể hiện năng lực vượt trội về triển khai hạ tầng MLOps quy mô lớn. Câu trả lời chính xác, mạch lạc.",
                "ai_rubric_scores": {"Technical Expertise": 9.2, "Communication": 9.0, "Problem Solving": 9.3},
                "ai_recommendation": "Strong Hire"
            }
        },
        {
            "application_id": khoa["app_id"],
            "interviewer_id": interviewer_tri_id,
            "title": "Phỏng vấn Thiết kế UI/UX & Design System - Bùi Minh Khoa",
            "round_number": 1,
            "scheduled_time": now - timedelta(days=1, hours=4), # 1 ngày trước (Đã hoàn thành)
            "duration_minutes": 50,
            "format": "online",
            "meeting_link": "https://meet.google.com/rec-uiux-khoa-2026",
            "confirmation_status": "completed",
            "questions": ["Cách xây dựng Design System linh hoạt", "Trải nghiệm Generative UI"],
            "eval": {
                "manual_score": 8.8,
                "manual_rubric_scores": {"UI Portfolio": 9.0, "Design System": 8.8, "UX Research": 8.5, "Teamwork": 9.0},
                "manual_notes": "Portfolio rất đẹp, tư duy tinh gọn hiện đại, nắm rõ atomic design principles.",
                "ai_rating": 8.9,
                "ai_summary": "Ứng viên có mắt thẩm mỹ cao, phù hợp mạnh mẽ với tiêu chuẩn sản phẩm B2B SaaS của công ty.",
                "ai_rubric_scores": {"Aesthetic Quality": 9.0, "Usability Focus": 8.8},
                "ai_recommendation": "Hire"
            }
        }
    ]

    for iv in interviews_to_seed:
        existing_iv = await conn.fetchval("""
            SELECT id FROM interviews WHERE application_id = $1 AND title = $2
        """, iv["application_id"], iv["title"])

        if not existing_iv:
            iv_id = str(uuid.uuid4())
            await conn.execute("""
                INSERT INTO interviews (id, application_id, company_id, interviewer_id, title, round_number, scheduled_time, duration_minutes, format, meeting_link, confirmation_status, ai_suggested_questions, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, iv_id, iv["application_id"], COMPANY_ID, iv["interviewer_id"], iv["title"], iv["round_number"],
            iv["scheduled_time"], iv["duration_minutes"], iv["format"], iv["meeting_link"], iv["confirmation_status"],
            json.dumps(iv["questions"]), now - timedelta(days=3), now - timedelta(days=1))
            print(f"✓ Đã thêm Lịch phỏng vấn: {iv['title']} (Thời gian: {iv['scheduled_time'].strftime('%d/%m/%Y %H:%M')})")

            # Thêm Evaluation nếu có
            if "eval" in iv:
                ev = iv["eval"]
                ev_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO interview_evaluations (id, interview_id, application_id, interviewer_id, manual_score, manual_rubric_scores, manual_notes, candidate_audio_consent, ai_rating, ai_summary, ai_rubric_scores, ai_recommendation, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                """, ev_id, iv_id, iv["application_id"], iv["interviewer_id"], ev["manual_score"],
                json.dumps(ev["manual_rubric_scores"]), ev["manual_notes"], "consented",
                ev["ai_rating"], ev["ai_summary"], json.dumps(ev["ai_rubric_scores"]), ev["ai_recommendation"],
                iv["scheduled_time"] + timedelta(hours=1), iv["scheduled_time"] + timedelta(hours=2))
                print(f"  -> Thêm Phiếu đánh giá Rubric (Điểm: {ev['manual_score']}/10, Khuyến nghị: {ev['ai_recommendation']})")
        else:
            print(f"ℹ Lịch phỏng vấn đã tồn tại: {iv['title']}")

    # 5. Thêm Email Logs (Lịch sử gửi email đa dạng)
    emails_to_seed = [
        {
            "candidate_id": tung["cand_id"],
            "application_id": tung["app_id"],
            "email_type": "invitation",
            "template_name": "invitation_technical_round",
            "recipient_email": tung["email"],
            "recipient_name": tung["full_name"],
            "subject": "[AI Recruiting Demo Corp] Thư mời phỏng vấn kỹ thuật chuyên sâu AI",
            "body_html": f"<p>Chào bạn <b>{tung['full_name']}</b>,</p><p>Công ty xin trân trọng mời bạn tham dự buổi phỏng vấn kỹ thuật trực tuyến qua Google Meet: <a href='https://meet.google.com/rec-ai-tung-2026'>https://meet.google.com/rec-ai-tung-2026</a>.</p>",
            "status": "opened",
            "sent_at": now - timedelta(days=2),
            "opened_at": now - timedelta(days=1, hours=22)
        },
        {
            "candidate_id": quynhanh["cand_id"],
            "application_id": quynhanh["app_id"],
            "email_type": "invitation",
            "template_name": "invitation_rd_round",
            "recipient_email": quynhanh["email"],
            "recipient_name": quynhanh["full_name"],
            "subject": "[AI Recruiting Demo Corp] Thư mời phỏng vấn vị trí AI Research Scientist",
            "body_html": f"<p>Chào bạn <b>{quynhanh['full_name']}</b>,</p><p>Ban tuyển dụng trân trọng gửi lời mời tham dự buổi phỏng vấn đánh giá năng lực R&D.</p>",
            "status": "sent",
            "sent_at": now - timedelta(days=1),
            "opened_at": None
        },
        {
            "candidate_id": next(c for c in new_candidates_data if c["full_name"] == "Vũ Hoàng Long")["cand_id"],
            "application_id": next(c for c in new_candidates_data if c["full_name"] == "Vũ Hoàng Long")["app_id"],
            "email_type": "offer",
            "template_name": "job_offer_letter",
            "recipient_email": "long.vu.qa@qualityfirst.vn",
            "recipient_name": "Vũ Hoàng Long",
            "subject": "[AI Recruiting Demo Corp] Thư mời nhận việc (Job Offer Letter) - Vị trí QA Lead",
            "body_html": "<p>Chào bạn <b>Vũ Hoàng Long</b>,</p><p>Chúc mừng bạn đã vượt qua xuất sắc các vòng đánh giá. Công ty trân trọng gửi bạn Thư mời nhận việc chính thức kèm mức đãi ngộ hấp dẫn.</p>",
            "status": "opened",
            "sent_at": now - timedelta(hours=18),
            "opened_at": now - timedelta(hours=12)
        }
    ]

    for em in emails_to_seed:
        existing_em = await conn.fetchval("""
            SELECT id FROM email_logs WHERE recipient_email = $1 AND email_type = $2 AND company_id = $3
        """, em["recipient_email"], em["email_type"], COMPANY_ID)
        if not existing_em:
            em_id = str(uuid.uuid4())
            await conn.execute("""
                INSERT INTO email_logs (id, company_id, candidate_id, application_id, template_name, email_type, recipient_email, recipient_name, subject, body_html, status, sent_at, opened_at, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, em_id, COMPANY_ID, em["candidate_id"], em["application_id"], em["template_name"], em["email_type"],
            em["recipient_email"], em["recipient_name"], em["subject"], em["body_html"], em["status"], em["sent_at"],
            em["opened_at"], em["sent_at"])
            print(f"✓ Đã thêm Email Log: {em['subject'][:55]}...")
        else:
            print(f"ℹ Email log đã tồn tại cho: {em['recipient_email']}")

    # 6. Tổng kết số lượng bản ghi trong database Neon
    counts = await conn.fetch("""
        SELECT 'companies' as tbl, count(*) as cnt FROM companies
        UNION ALL SELECT 'users', count(*) FROM users
        UNION ALL SELECT 'job_postings', count(*) FROM job_postings
        UNION ALL SELECT 'candidates', count(*) FROM candidates
        UNION ALL SELECT 'applications', count(*) FROM applications
        UNION ALL SELECT 'interviews', count(*) FROM interviews
        UNION ALL SELECT 'interview_evaluations', count(*) FROM interview_evaluations
        UNION ALL SELECT 'email_logs', count(*) FROM email_logs;
    """)

    print("\n" + "="*60)
    print("THỐNG KÊ TOÀN DIỆN CSDL NEON POSTGRESQL SAU KHI THÊM DỮ LIỆU:")
    print("="*60)
    for r in counts:
        print(f"  • {r['tbl']:25s}: {r['cnt']:5d} bản ghi")
    print("="*60)

    await conn.close()
    print("Hoàn tất thêm dữ liệu vào Neon PostgreSQL thành công 100%!")

if __name__ == "__main__":
    asyncio.run(seed_neon())
