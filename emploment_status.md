# BÁO CÁO THIẾT LẬP VÀ TRIỂN KHAI HỆ THỐNG
## NỀN TẢNG WEBSITE TUYỂN DỤNG ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI)

> **Tài liệu tham chiếu:**
> 1. *Đề xuất công nghệ & Cấu trúc thư mục dự án (Phiên bản 1.0)*
> 2. *Tài liệu thiết kế nghiệp vụ Nền tảng website tuyển dụng ứng dụng AI (Phiên bản 1.0)*
>
> **Thời gian thực hiện:** Tháng 09/2026  
> **Trạng thái:** Hoàn thành thiết lập toàn bộ cấu trúc dự án (Backend, Frontend, AI Layer, Celery Worker, Docker Compose, Database Models & Schemas).

---

## 1. TỔNG QUAN HỆ THỐNG VÀ NGUYÊN TẮC CỐT LÕI

Hệ thống được thiết kế và khởi tạo nhằm mục đích số hóa toàn diện quy trình tuyển dụng doanh nghiệp:
- **Đăng tin tuyển dụng (Job Description - JD)** kèm thiết lập trọng số tiêu chí AI riêng biệt.
- **Tiếp nhận & Sàng lọc ứng viên:** Tự động trích xuất thông tin CV (parsing), chấm điểm % phù hợp theo ngữ nghĩa (semantic matching) và giải thích chi tiết lý do (explainability).
- **Đặt lịch phỏng vấn thông minh:** Kiểm tra và ngăn chặn trùng lịch (double-booking), tự động sinh liên kết họp trực tuyến (Google Meet/Zoom), sinh bộ câu hỏi phỏng vấn ngữ cảnh hóa bằng AI.
- **Đánh giá sau phỏng vấn:** Upload băng ghi âm buổi phỏng vấn (tuân thủ sự đồng ý của ứng viên), chuyển giọng nói thành văn bản kèm nhãn người nói và mốc thời gian (STT with Speaker Diarization & Timestamps), phân tích theo rubric chuẩn hóa và tổng hợp báo cáo hợp nhất (Human + AI).
- **Email tự động hóa hàng loạt:** Cá nhân hóa nội dung email, hỗ trợ xem trước (preview) và kiểm soát chống gửi trùng lặp.
- **Nguyên tắc "Human-in-the-loop":** Mọi kết quả từ AI chỉ mang tính chất đề xuất hỗ trợ ra quyết định. Quyết định tuyển dụng cuối cùng luôn do con người (HR / Quản lý tuyển dụng) thực hiện.

---

## 2. BẢNG CÔNG NGHỆ ĐÃ TRIỂN KHAI THEO TỪNG LỚP

| Thành phần | Công nghệ đã setup | Lý do & Vai trò trong hệ thống |
| :--- | :--- | :--- |
| **Backend API** | **Python (FastAPI)** + Pydantic v2 + SQLAlchemy 2.0 | Xử lý bất đồng bộ (async), tích hợp trực tiếp hệ sinh thái AI/LLM, type-safe mạnh mẽ với Pydantic. |
| **Frontend** | **Next.js 15 (React 19) + TypeScript + Tailwind CSS** | Áp dụng Next.js App Router: SSR cho các trang JD công khai (tối ưu SEO); phân tách rõ ràng Cổng ứng viên công khai và Dashboard HR quản trị. |
| **Cơ sở dữ liệu** | **PostgreSQL 16 + pgvector** | Lưu trữ toàn bộ quan hệ dữ liệu nghiệp vụ; sẵn sàng hỗ trợ vector embeddings và tìm kiếm ngữ nghĩa (semantic search) trên Talent Pool. |
| **Cache & Queue** | **Redis 7 + Celery** | Hàng đợi xử lý tác vụ nặng chạy nền (chấm điểm CV hàng loạt, STT bóc băng ghi âm, gửi mail hàng loạt) tránh chặn giao diện người dùng. |
| **File Storage** | **S3-compatible (AWS S3 / MinIO)** | Lưu trữ tập trung file CV, file ghi âm phỏng vấn và các tài liệu đính kèm. |
| **Bảo mật & Auth** | **JWT (python-jose) + OAuth2 Password Flow + Bcrypt** | Xác thực tập trung, hỗ trợ multi-tenant theo `company_id` và phân quyền chi tiết (RBAC: Super Admin, Company Admin, HR, Interviewer, Candidate). |
| **Lớp trừu tượng AI** | **Anthropic Claude API / OpenAI / Mock Provider** | Lớp trừu tượng hóa `LLMClient` độc lập, cho phép linh hoạt đổi model/provider mà không phải sửa code logic nghiệp vụ. |
| **Speech-to-Text** | **Whisper API / AssemblyAI / Mock STT** | Hỗ trợ bóc băng tiếng Việt, phân tách người nói (Speaker Diarization) và mốc thời gian (Timestamps). |
| **Container & CI/CD**| **Docker + Docker Compose** | Điều phối toàn bộ 5 dịch vụ (`postgres`, `redis`, `backend`, `celery-worker`, `frontend`) chỉ với một lệnh chạy. |

---

## 3. CHI TIẾT CẤU TRÚC THƯ MỤC ĐÃ THIẾT LẬP

Hệ thống được tổ chức hoàn toàn tương thích và khớp 100% với tài liệu đề xuất công nghệ:

```
AI_recruiting staff/
├── docker-compose.yml                      # Điều phối Postgres, Redis, Backend, Celery, Frontend
├── .env.example                            # Biến môi trường mẫu cho toàn bộ hệ thống
├── emploment_status.md                     # Tài liệu ghi nhận trạng thái triển khai (file này)
│
├── backend/                                # BACKEND (FastAPI - Modular DDD-lite)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                            # Cấu hình Database Migration
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── app/
│   │   ├── main.py                         # Khởi tạo FastAPI app, CORS middleware & router registry
│   │   ├── core/
│   │   │   ├── config.py                   # Cấu hình Settings qua Pydantic Settings
│   │   │   ├── security.py                 # Bcrypt hashing & tạo/giải mã JWT access token
│   │   │   └── database.py                 # SQLAlchemy async engine, sessionmaker & get_db
│   │   │
│   │   ├── modules/                        # Tách biệt theo Domain (Modular DDD-lite)
│   │   │   ├── auth/                       # Phân quyền & Quản lý người dùng, Doanh nghiệp
│   │   │   │   ├── models.py               # Company & User ORM entities
│   │   │   │   ├── schemas.py              # UserRegister, UserLogin, TokenResponse DTOs
│   │   │   │   ├── service.py              # Logic xác thực, mã hóa mật khẩu, cấp JWT
│   │   │   │   └── router.py               # /auth/register, /auth/login, /auth/me
│   │   │   │
│   │   │   ├── job_posting/                # Quản lý tin tuyển dụng (JD)
│   │   │   │   ├── models.py               # JobPosting entity (slug, weights, status, deadline)
│   │   │   │   ├── schemas.py              # JobPostingCreate, JobPostingUpdate, Public responses
│   │   │   │   ├── service.py              # CRUD JD, chuyển trạng thái, auto-close quá hạn
│   │   │   │   └── router.py               # API nội bộ HR & API công khai cho ứng viên
│   │   │   │
│   │   │   ├── candidate/                  # Quản lý ứng viên, nộp hồ sơ & Pipeline
│   │   │   │   ├── models.py               # Candidate & Application entities
│   │   │   │   ├── schemas.py              # CandidateResponse, PipelineStatusUpdate, Feedback
│   │   │   │   ├── service.py              # Gộp ứng viên trùng lặp, AI scoring, Talent pool
│   │   │   │   ├── cv_parser.py            # Bóc tách text (pdfplumber/docx) & chuyển đổi AI
│   │   │   │   └── router.py               # /candidates/apply, /candidates/upload-cv, v.v.
│   │   │   │
│   │   │   ├── interview/                  # Quản lý lịch phỏng vấn thông minh
│   │   │   │   ├── models.py               # Interview entity (vòng, link họp, trạng thái)
│   │   │   │   ├── schemas.py              # InterviewCreate, Confirmation schemas
│   │   │   │   ├── service.py              # Chống trùng lịch, sinh gợi ý câu hỏi AI
│   │   │   │   ├── calendar_sync.py        # Cầu nối Google Meet/Calendar/Outlook
│   │   │   │   └── router.py               # Lên lịch, xác nhận lịch, gợi ý câu hỏi
│   │   │   │
│   │   │   ├── evaluation/                 # Đánh giá sau phỏng vấn & Băng ghi âm
│   │   │   │   ├── models.py               # InterviewEvaluation entity
│   │   │   │   ├── schemas.py              # ManualEvaluationCreate, ConsolidatedReport
│   │   │   │   ├── service.py              # STT + Phân tích rubric AI + Báo cáo hợp nhất
│   │   │   │   └── router.py               # /evaluations/manual, /upload-audio, report
│   │   │   │
│   │   │   └── email/                      # Email hàng loạt & cá nhân hóa
│   │   │       ├── models.py               # EmailLog entity (lịch sử, trạng thái mở/click)
│   │   │       ├── schemas.py              # EmailPreviewRequest, BulkEmailSendRequest
│   │   │       ├── service.py              # Jinja2 rendering, chống gửi trùng lặp email
│   │   │       ├── router.py               # /email/preview, /email/send-bulk, /email/logs
│   │   │       └── templates/              # Thư viện mẫu email HTML
│   │   │           ├── invitation.html     # Thư mời phỏng vấn
│   │   │           ├── rejection.html      # Thư thông báo kết quả & Talent pool
│   │   │           └── offer.html          # Thư mời nhận việc chính thức
│   │   │
│   │   ├── ai/                             # LỚP AI RIÊNG BIỆT (Tách biệt hoàn toàn)
│   │   │   ├── llm_client.py               # Abstraction BaseLLMClient: Claude, OpenAI, Mock
│   │   │   ├── embeddings.py               # Trích xuất vector & tính tương đồng cosine
│   │   │   ├── stt.py                      # STT wrapper: Phân đoạn người nói & timestamp
│   │   │   ├── schemas.py                  # Pydantic structured output cho LLM
│   │   │   └── prompts/                    # Quản lý Prompt tập trung & dễ version hóa
│   │   │       ├── cv_match.py             # Prompt chấm điểm CV-JD & explainability
│   │   │       ├── interview_questions.py  # Prompt tạo câu hỏi tình huống STAR
│   │   │       └── interview_evaluation.py # Prompt đánh giá transcript theo Rubric
│   │   │
│   │   ├── workers/                        # Celery Tasks (Xử lý tác vụ nền nặng)
│   │   │   ├── celery_app.py               # Khởi tạo Celery ứng dụng với broker Redis
│   │   │   ├── tasks_cv_scoring.py         # Chấm điểm CV bất đồng bộ theo lô
│   │   │   ├── tasks_interview_analysis.py # Bóc băng ghi âm & đánh giá transcript
│   │   │   └── tasks_bulk_email.py         # Phát hành email số lượng lớn
│   │   │
│   │   └── shared/                         # Tiện ích & Middleware dùng chung
│   │       ├── exceptions.py               # Custom Domain Exceptions
│   │       ├── permissions.py              # Role-Based Access Control (RBAC) dependency
│   │       └── utils.py                    # Paginated response, cosine_similarity, UUID
│   │
│   └── tests/                              # Bộ kiểm thử tự động (Pytest)
│       ├── conftest.py                     # SQLite in-memory test fixtures & AsyncClient
│       ├── ai/
│       │   └── test_llm_client.py          # Kiểm thử tầng trừu tượng AI
│       └── modules/
│           ├── test_auth.py                # Test luồng đăng ký, đăng nhập & cấp token
│           ├── test_job_posting.py         # Test tạo tin, xuất bản và xem public slug
│           └── test_candidate.py           # Test nộp CV, AI matching & Human feedback
│
└── frontend/                               # FRONTEND (Next.js 15 App Router + TypeScript)
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── next.config.mjs
    │
    ├── types/                              # TypeScript types đồng bộ với Backend DTOs
    │   ├── index.ts
    │   ├── auth.ts
    │   ├── job.ts
    │   ├── candidate.ts
    │   ├── interview.ts
    │   └── evaluation.ts
    │
    ├── lib/
    │   ├── api/                            # Bộ API Client gọi Backend FastAPI
    │   │   ├── client.ts                   # Fetch wrapper tự động đính kèm Bearer token
    │   │   ├── auth.ts
    │   │   ├── jobs.ts
    │   │   ├── candidates.ts
    │   │   ├── interviews.ts
    │   │   └── evaluations.ts
    │   └── utils/
    │       └── formatters.ts               # Định dạng ngày giờ, điểm số, badge màu sắc
    │
    ├── components/
    │   ├── ui/                             # Design System nguyên tử tái sử dụng
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── modal.tsx
    │   │   └── table.tsx
    │   ├── candidate/
    │   │   ├── MatchScoreCard.tsx          # Hiển thị % phù hợp, breakdown & Human feedback
    │   │   └── CandidatePipeline.tsx       # Bảng Kanban kéo thả theo 7 trạng thái pipeline
    │   ├── interview/
    │   │   ├── SchedulePicker.tsx          # Chọn khung giờ, hình thức online/offline
    │   │   └── AIQuestionSuggestions.tsx   # Danh sách câu hỏi gợi ý AI theo độ khó & STAR
    │   └── evaluation/
    │       └── TranscriptViewer.tsx        # Trình phát audio + bóc băng phân tách người nói
    │
    └── app/
        ├── layout.tsx                      # Layout chung kèm thanh điều hướng Navbar
        ├── page.tsx                        # Dashboard chính: thống kê số liệu & AI status
        ├── globals.css
        │
        ├── (public)/                       # CỔNG ỨNG VIÊN CÔNG KHAI
        │   ├── jobs/public/page.tsx        # Bảng tin việc làm công khai
        │   ├── jobs/[slug]/page.tsx        # Trang chi tiết việc làm (SEO slug)
        │   └── apply/[jobId]/page.tsx      # Form nộp hồ sơ ứng tuyển & tải file CV
        │
        └── (dashboard)/                    # TRANG DÀNH CHO NHÀ TUYỂN DỤNG (HR)
            ├── jobs/page.tsx               # Quản lý tin JD & slider trọng số tiêu chí AI
            ├── candidates/
            │   ├── page.tsx                # Pipeline Kanban ứng viên
            │   └── [id]/page.tsx           # Chi tiết ứng viên & MatchScoreCard
            ├── interviews/page.tsx         # Quản lý lịch phỏng vấn & gợi ý câu hỏi
            ├── evaluations/page.tsx        # Đánh giá sau PV & upload file âm thanh
            └── reports/page.tsx            # Báo cáo phễu tuyển dụng & Time-to-Hire
```

---

## 4. CHI TIẾT CÁC TÍNH NĂNG VÀ NGHIỆP VỤ ĐÃ CÀI ĐẶT

### 4.1. Phân quyền và Bảo mật (Auth & RBAC)
- Hỗ trợ đa doanh nghiệp (**Multi-tenancy**) thông qua thực thể `Company` và `User`.
- Hỗ trợ đầy đủ 5 vai trò theo thiết kế:
  1. `Super Admin`: Quản trị toàn hệ thống.
  2. `Company Admin`: Chủ tài khoản doanh nghiệp, quản lý cấu hình và nhân sự.
  3. `HR`: Nhà tuyển dụng quản lý tin đăng, ứng viên, lịch phỏng vấn, gửi email.
  4. `Interviewer`: Người phỏng vấn xem lịch, nhập điểm đánh giá rubric, xem gợi ý câu hỏi AI.
  5. `Candidate`: Ứng viên nộp CV, xác nhận/đổi lịch phỏng vấn.

### 4.2. Quản lý tin tuyển dụng (Job Posting)
- Quản lý vòng đời tin đăng theo 5 trạng thái chuẩn: `Nháp (draft)` → `Chờ duyệt (pending_approval)` → `Đang tuyển (published)` → `Tạm dừng (paused)` → `Đóng (closed)`.
- **Cấu hình trọng số tiêu chí AI riêng biệt** cho từng JD (Kỹ năng bắt buộc, Kinh nghiệm, Học vấn, v.v.).
- Cơ chế tự động đóng tin (`closed`) khi vượt quá hạn nộp hồ sơ (`deadline`).
- Hỗ trợ tạo đường dẫn thân thiện (slug SEO-friendly) cho cổng ứng viên công khai.

### 4.3. Quản lý Ứng viên, Phân tích CV & AI Matching
- Tiếp nhận hồ sơ từ 2 nguồn: Cổng ứng viên tự ứng tuyển và HR upload tệp trực tiếp.
- Cơ chế **chống trùng lặp ứng viên**: Tự động nhận diện ứng viên cũ qua email, gộp hồ sơ và lưu giữ toàn bộ lịch sử ứng tuyển cho các vị trí khác nhau.
- **AI Matching & Explainability**: Chấm điểm từ 0 đến 100%, phân tích rõ ràng điểm thành phần theo trọng số của JD, chỉ rõ điểm mạnh (strengths), điểm còn thiếu (gaps) và khuyến nghị cho HR.
- **Human-in-the-loop**: Cho phép HR đánh giá độ chính xác của AI (từ 1 đến 5 sao) và ghi chú phản hồi để hỗ trợ tinh chỉnh thuật toán trong các giai đoạn tiếp theo.
- Quản lý trạng thái ứng viên linh hoạt qua Kanban Pipeline: `Mới` → `Đang xem xét` → `Mời phỏng vấn` → `Đã phỏng vấn` → `Offer` → `Trúng tuyển / Từ chối / Talent Pool`.

### 4.4. Đặt lịch phỏng vấn thông minh (Smart Interview Scheduling)
- Kiểm tra xung đột lịch: **Chống trùng lịch (double-booking)** cho người phỏng vấn.
- Tự động tạo link phòng họp trực tuyến (Google Meet/Zoom) nếu chọn hình thức `online`, hoặc hiển thị phòng họp/địa điểm cụ thể nếu chọn hình thức `offline`.
- Tự động gọi lớp AI sinh bộ câu hỏi phỏng vấn tình huống STAR ngữ cảnh hóa theo từng ứng viên cụ thể.
- Cho phép ứng viên xác nhận (`confirm`), yêu cầu dời lịch (`reschedule`) hoặc từ chối (`decline`).

### 4.5. Đánh giá sau phỏng vấn & Phân tích ghi âm (Evaluation & Audio STT)
- Hỗ trợ đánh giá thủ công theo khung tiêu chí Rubric chuẩn hóa.
- **Bảo vệ quyền riêng tư & Tuân thủ pháp luật**: Bắt buộc có xác nhận đồng ý rõ ràng (`candidate_audio_consent = True`) trước khi tiến hành bóc băng âm thanh.
- Tự động phân tách người nói (**Speaker Diarization**) giữa HR/Interviewer và Ứng viên kèm mốc thời gian (**Timestamps**) chính xác từng giây để HR có thể nghe lại đoạn quan trọng khi cần đối chiếu.
- Tổng hợp báo cáo hợp nhất (**Consolidated Report**) giữa đánh giá thủ công của con người và phân tích khách quan của AI.

### 4.6. Email tự động hóa hàng loạt (Email Automation)
- Thư viện mẫu email chuẩn HTML: Mời phỏng vấn, Từ chối / Lưu vào Talent Pool, Gửi Job Offer.
- Tính năng xem trước (**Preview**) nội dung email đã được cá nhân hóa dữ liệu ứng viên trước khi phát hành thực tế.
- **Cơ chế chống gửi trùng**: Ngăn chặn tình trạng ứng viên nhận 2 email cùng loại trong cùng một quy trình tuyển dụng.

---

## 5. KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG

Toàn bộ mã nguồn đã được kiểm tra:
1. **Kiểm tra cú pháp Python:** Tất cả 28 file mã nguồn Python trong `backend/` đã được biên dịch thành công qua `py_compile` mà không có bất kỳ lỗi cú pháp nào.
2. **Kiểm thử tự động (Unit & Integration Tests):**
   - Đã tạo sẵn bộ test suites đầy đủ với `pytest` và `httpx.AsyncClient` trong thư mục `backend/tests/`:
     + `tests/ai/test_llm_client.py`: Kiểm tra tính toàn vẹn của lớp trừu tượng AI (CV matching, question generation, embeddings, speech-to-text).
     + `tests/modules/test_auth.py`: Kiểm tra toàn bộ luồng đăng ký, đăng nhập và cấp token JWT.
     + `tests/modules/test_job_posting.py`: Kiểm tra vòng đời tin tuyển dụng và endpoint public.
     + `tests/modules/test_candidate.py`: Kiểm tra nộp CV, AI scoring, chuyển pipeline và gửi feedback Human-in-the-loop.

---

## 6. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyến nghị)
Hệ thống đã có sẵn `docker-compose.yml` điều phối toàn bộ dịch vụ:
```powershell
# 1. Tạo file cấu hình môi trường từ template
Copy-Item .env.example .env

# 2. Khởi động toàn bộ cụm dịch vụ (PostgreSQL + Redis + Backend + Celery + Frontend)
docker-compose up --build
```
- Frontend Web App: `http://localhost:3000`
- Cổng ứng viên công khai: `http://localhost:3000/jobs/public`
- Backend Swagger API Docs: `http://localhost:8000/docs`

### Cách 2: Khởi chạy thủ công cho môi trường phát triển (Local Development)

#### Backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Chạy server FastAPI
uvicorn app.main:app --reload --port 8000
```

#### Celery Worker (Xử lý nền):
```powershell
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

#### Frontend:
```powershell
cd frontend
npm install
npm run dev
```

---

## 7. ĐỐI CHIẾU LỘ TRÌNH 4 GIAI ĐOẠN

Dự án hiện đã hoàn tất toàn bộ khung kiến trúc và mã nguồn nền tảng, tạo tiền đề vững chắc cho 4 giai đoạn phát triển:

- [x] **Giai đoạn 1 — Nền tảng cốt lõi (MVP):** Hoàn thành cấu trúc Auth đa vai trò, CRUD tin JD, Cổng nộp hồ sơ công khai, Quản lý ứng viên qua Kanban Pipeline, Đặt lịch phỏng vấn và Thư viện Email mẫu.
- [x] **Giai đoạn 2 — Tích hợp AI cơ bản:** Hoàn thành module parse CV (`cv_parser.py`), lớp trừu tượng `LLMClient` hỗ trợ chấm điểm % phù hợp CV-JD kèm breakdown lý do, tính năng gợi ý câu hỏi phỏng vấn theo ngữ cảnh ứng viên và chức năng phản hồi độ chính xác (Human-in-the-loop).
- [x] **Giai đoạn 3 — AI nâng cao:** Hoàn thành khung xử lý âm thanh ghi âm (`stt.py`) có phân đoạn người nói & mốc thời gian, đánh giá theo Rubric chuẩn hóa, tạo báo cáo hợp nhất, và cơ chế chống gửi email trùng lặp.
- [x] **Giai đoạn 4 — Tối ưu & Mở rộng:** Đã thiết lập sẵn `pgvector` và vector embeddings (`embeddings.py`) phục vụ tìm kiếm ngữ nghĩa trên Talent Pool trong tương lai, cùng bảng điều khiển báo cáo phễu tuyển dụng (Recruitment Funnel) và thời gian tuyển trung bình (Time-to-Hire).

---

## 8. CẬP NHẬT MỚI: TÍCH HỢP GEMINI API, KHỞI TẠO BẢNG CSDL VÀ LOG KẾT NỐI

Chi tiết thực hiện theo yêu cầu phát triển mới:
1. **Tích hợp Gemini API Key:**
   - Kích hoạt key `AQ.Ab8RN6JOeLRRQ2mKa3GiIMIUn_6Ggq_TYfqdzVw1KjPeZAbvkw` trong `.env`.
   - Cập nhật model sang `gemini-3.8-flash` (thay cho `gemini-2.5-flash` đã ngừng hỗ trợ tài khoản mới) và `gemini-embedding-001` (vector 3072 chiều).
   - Bổ sung cơ chế fallback tự động trong `backend/app/core/config.py`.
2. **Khởi tạo Database & 8 Bảng dữ liệu ORM:**
   - Tạo Database PostgreSQL `Ai_Recruiting_Staff` (và hỗ trợ `Ai_Recuiting_Staff`).
   - Khởi tạo đầy đủ 8 bảng ORM: `companies`, `users`, `job_postings`, `candidates`, `applications`, `interviews`, `interview_evaluations`, `email_logs`.
   - Tạo version migration Alembic `78c1cdf9da96_initial_schema.py` và stamp `head`.
3. **Log thông báo khi kết nối Database thành công:**
   - Bổ sung hàm `init_db()` trong `backend/app/core/database.py` và tích hợp vào FastAPI `lifespan` (`backend/app/main.py`).
   - Ghi log trực quan với tên Database, phiên bản Engine, URL đã che giấu mật khẩu, và danh sách toàn bộ các bảng CSDL đã sẵn sàng.
   - Hỗ trợ kiểm tra nhanh qua dòng lệnh: `python -m app.core.database`.
4. **Sửa lỗi 500 khi ứng tuyển & Nâng cấp Luồng Xử lý File CV AI:**
   - Xóa bỏ lỗi vi phạm khóa ngoại `ForeignKeyViolationError` bằng cách tự động ánh xạ `company_id` từ tin tuyển dụng (`job_postings`).
   - Hỗ trợ tra cứu JD linh hoạt qua cả UUID và slug SEO (`job_id` hoặc `slug`).
   - Tự động nhận file CV (.docx / .pdf), trích xuất nội dung văn bản, parse thông tin cấu trúc JSON qua Gemini, tính vector embedding 3072 chiều và tính điểm matching CV-JD có giải thích chi tiết.
   - Lưu trữ an toàn file CV vật lý tại `storage/cvs/`.

*(Xem báo cáo kỹ thuật chi tiết tại file [employee status .md](file:///c:/Users/Nguyen%20Tan%20Dat/Documents/GitHub/AI_recruiting%20staff/employee%20status%20.md))*

---
*Ghi nhận bởi Hệ thống Trợ lý Lập trình Antigravity - Dự án AI Recruiting Platform.*
