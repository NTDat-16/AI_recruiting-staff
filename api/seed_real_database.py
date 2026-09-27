import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import AsyncSessionLocal, import_all_models
import_all_models()
from app.modules.auth.models import Company, User
from app.modules.job_posting.models import JobPosting
from app.modules.candidate.models import Candidate, Application
from app.modules.interview.models import Interview
from app.modules.evaluation.models import InterviewEvaluation
from app.modules.email.models import EmailLog
from sqlalchemy import select


async def seed_full_real_data():
    async with AsyncSessionLocal() as session:
        # 1. Company
        comp = (await session.execute(select(Company).where(Company.name == 'AI Recruiting Demo Corp'))).scalar_one_or_none()
        if not comp:
            comp = Company(
                name='AI Recruiting Demo Corp',
                tax_code='0109999999',
                subscription_plan='enterprise',
                contact_email='contact@democorp.vn'
            )
            session.add(comp)
            await session.commit()
            await session.refresh(comp)

        # 2. User
        user = (await session.execute(select(User).where(User.email == 'demo.hr@recruiting.vn'))).scalar_one_or_none()
        if not user:
            from app.core.security import get_password_hash
            user = User(
                email='demo.hr@recruiting.vn',
                hashed_password=get_password_hash('Demo123456@'),
                full_name='HR Manager (Demo)',
                role='hr',
                company_id=comp.id,
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # 3. Job Postings
        job_defs = [
            {
                'title': 'Senior Python AI Engineer',
                'slug': 'senior-python-ai-engineer-demo',
                'dept': 'AI Engineering',
                'loc': 'Hà Nội / Hybrid',
                'salary': '35,000,000 - 55,000,000 VND',
                'desc': 'Tuyển dụng Kỹ sư Python AI phát triển các hệ thống Agentic AI, RAG và LLM orchestration.',
                'req': 'Tối thiểu 3 năm kinh nghiệm Python, FastAPI, PostgreSQL, Redis, Docker, kinh nghiệm với LLM API.',
                'weights': {'required_skills': 0.4, 'experience_years': 0.3, 'education': 0.15, 'soft_skills': 0.15},
            },
            {
                'title': 'Frontend Next.js Engineer (React 19)',
                'slug': 'frontend-nextjs-engineer-demo',
                'dept': 'Product Development',
                'loc': 'Hồ Chí Minh / Remote',
                'salary': '25,000,000 - 40,000,000 VND',
                'desc': 'Phát triển giao diện web tốc độ cao sử dụng Next.js 15, TypeScript và Tailwind CSS.',
                'req': 'Thành thạo React, Next.js App Router, Tailwind CSS, TypeScript, REST API.',
                'weights': {'required_skills': 0.45, 'experience_years': 0.25, 'education': 0.15, 'soft_skills': 0.15},
            },
            {
                'title': 'DevOps & Cloud Infrastructure Lead',
                'slug': 'devops-cloud-architect-demo',
                'dept': 'Infrastructure & Platform',
                'loc': 'Hà Nội / Hybrid',
                'salary': '40,000,000 - 60,000,000 VND',
                'desc': 'Chịu trách nhiệm kiến trúc đám mây AWS/GCP, thiết lập CI/CD, Kubernetes cluster và hệ thống giám sát Prometheus/Grafana.',
                'req': 'Tối thiểu 4 năm kinh nghiệm DevOps/SRE, thành thạo Docker, Kubernetes, Terraform, AWS, Linux, CI/CD pipelines.',
                'weights': {'required_skills': 0.4, 'experience_years': 0.3, 'education': 0.15, 'soft_skills': 0.15},
            }
        ]

        jobs_by_slug = {}
        for jdef in job_defs:
            j = (await session.execute(select(JobPosting).where(JobPosting.slug == jdef['slug']))).scalar_one_or_none()
            if not j:
                j = JobPosting(
                    company_id=comp.id,
                    created_by_id=user.id,
                    title=jdef['title'],
                    slug=jdef['slug'],
                    department=jdef['dept'],
                    location=jdef['loc'],
                    salary_range=jdef['salary'],
                    description=jdef['desc'],
                    requirements=jdef['req'],
                    ai_criteria_weights=jdef['weights'],
                    status='published'
                )
                session.add(j)
                await session.commit()
                await session.refresh(j)
            jobs_by_slug[jdef['slug']] = j

        # 4. Candidates & Applications
        candidates_data = [
            {
                'name': 'Nguyễn Văn An',
                'email': 'an.nguyen@example.com',
                'phone': '0912345671',
                'job_slug': 'senior-python-ai-engineer-demo',
                'status': 'interview_invited',
                'score': 92.5,
                'skills': ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'PostgreSQL', 'Docker'],
                'years': 4.5,
                'edu': 'Đại học Bách Khoa Hà Nội',
                'tags': ['Python', 'FastAPI', 'Senior AI'],
                'strengths': ['Thành thạo FastAPI & LangChain', 'Kinh nghiệm tối ưu RAG vector latency'],
                'gaps': ['Chưa có nhiều kinh nghiệm triển khai Kubernetes'],
                'rec': 'Ưu tiên phỏng vấn chuyên môn kỹ thuật sâu.'
            },
            {
                'name': 'Trần Thị Mai',
                'email': 'mai.tran@example.com',
                'phone': '0912345672',
                'job_slug': 'frontend-nextjs-engineer-demo',
                'status': 'reviewing',
                'score': 86.0,
                'skills': ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Redux', 'REST API'],
                'years': 3.0,
                'edu': 'Đại học Công nghệ - ĐHQGHN',
                'tags': ['Next.js', 'React', 'Frontend'],
                'strengths': ['Vững vàng React 19 và Server Components', 'TypeScript chuẩn mực'],
                'gaps': ['Chưa thực chiến nhiều với Web Workers'],
                'rec': 'Phù hợp tốt với vị trí Frontend Developer.'
            },
            {
                'name': 'Lê Hoàng Phúc',
                'email': 'phuc.le@example.com',
                'phone': '0912345673',
                'job_slug': 'senior-python-ai-engineer-demo',
                'status': 'offered',
                'score': 95.0,
                'skills': ['Python', 'FastAPI', 'Celery', 'Redis', 'LLM', 'RAG', 'Vector DB', 'PostgreSQL'],
                'years': 5.0,
                'edu': 'ĐH Bách Khoa TP.HCM',
                'tags': ['Lead AI', 'Multi-Agent', 'Top Candidate'],
                'strengths': ['Kinh nghiệm scale hệ thống AI triệu người dùng', 'Làm chủ Multi-Agent System'],
                'gaps': [],
                'rec': 'Ứng viên xuất sắc nhất, đề xuất gửi Offer ngay.'
            },
            {
                'name': 'Phạm Hải Đăng',
                'email': 'dang.pham@example.com',
                'phone': '0912345674',
                'job_slug': 'frontend-nextjs-engineer-demo',
                'status': 'new',
                'score': 78.0,
                'skills': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
                'years': 1.5,
                'edu': 'Đại học FPT',
                'tags': ['Junior', 'React'],
                'strengths': ['Nhiệt huyết, tư duy học hỏi nhanh'],
                'gaps': ['Chưa có kinh nghiệm Next.js App Router'],
                'rec': 'Xem xét phỏng vấn nếu cần bổ sung nhân sự Junior.'
            },
            {
                'name': 'Đặng Quốc Huy',
                'email': 'huy.dang@example.com',
                'phone': '0912345675',
                'job_slug': 'devops-cloud-architect-demo',
                'status': 'interviewed',
                'score': 91.0,
                'skills': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Linux', 'GitLab CI', 'Prometheus'],
                'years': 4.0,
                'edu': 'Đại học Bách Khoa Hà Nội',
                'tags': ['DevOps', 'Kubernetes', 'AWS'],
                'strengths': ['Thành thạo Kubernetes và Terraform', 'Thiết kế kiến trúc Multi-AZ AWS'],
                'gaps': ['Ít kinh nghiệm với Azure'],
                'rec': 'Hoàn thành tốt phỏng vấn kỹ thuật, chuẩn bị họp hội đồng đánh giá.'
            },
            {
                'name': 'Vũ Bích Ngọc',
                'email': 'ngoc.vu@example.com',
                'phone': '0912345676',
                'job_slug': 'frontend-nextjs-engineer-demo',
                'status': 'hired',
                'score': 93.5,
                'skills': ['React 19', 'Next.js', 'TypeScript', 'Tailwind', 'GraphQL', 'Storybook'],
                'years': 4.0,
                'edu': 'ĐH Ngoại Thương & Viện CNTT',
                'tags': ['Frontend', 'UI/UX', 'Hired'],
                'strengths': ['Tư duy thẩm mỹ xuất sắc, tối ưu Lighthouse 99/100', 'Giao tiếp tốt'],
                'gaps': [],
                'rec': 'Đã nhận việc thành công.'
            },
            {
                'name': 'Hoàng Minh Tuấn',
                'email': 'tuan.hoang@example.com',
                'phone': '0912345677',
                'job_slug': 'senior-python-ai-engineer-demo',
                'status': 'talent_pool',
                'score': 72.0,
                'skills': ['Python', 'Flask', 'Machine Learning', 'Scikit-learn', 'Pandas'],
                'years': 2.0,
                'edu': 'Đại học Bách Khoa',
                'tags': ['Data Science', 'Talent Pool'],
                'strengths': ['Phân tích dữ liệu tốt, toán học vững'],
                'gaps': ['Thiếu kinh nghiệm Backend FastAPI và LLM API thực chiến'],
                'rec': 'Lưu trữ vào Talent Pool phục vụ các dự án Data Science trong tương lai.'
            }
        ]

        saved_apps = {}
        for cdata in candidates_data:
            cand = (await session.execute(select(Candidate).where(Candidate.email == cdata['email'], Candidate.company_id == comp.id))).scalar_one_or_none()
            if not cand:
                cand = Candidate(
                    company_id=comp.id,
                    full_name=cdata['name'],
                    email=cdata['email'],
                    phone=cdata['phone'],
                    parsed_data={
                        'skills': cdata['skills'],
                        'experience_years': cdata['years'],
                        'education': cdata['edu']
                    },
                    tags=cdata['tags'],
                    source='direct_apply',
                    rating=4.5
                )
                session.add(cand)
                await session.flush()

                job = jobs_by_slug[cdata['job_slug']]
                app = Application(
                    job_posting_id=job.id,
                    candidate_id=cand.id,
                    match_score=cdata['score'],
                    score_breakdown={
                        'overall_score': cdata['score'],
                        'breakdown': [
                            {'criterion': 'Kỹ năng chuyên môn', 'weight': 0.4, 'score': cdata['score'] + 2, 'comment': 'Kỹ năng đáp ứng yêu cầu công việc'},
                            {'criterion': 'Số năm kinh nghiệm', 'weight': 0.3, 'score': cdata['score'] - 1, 'comment': f"{cdata['years']} năm kinh nghiệm thực chiến"},
                            {'criterion': 'Học vấn & Bằng cấp', 'weight': 0.15, 'score': 90.0, 'comment': cdata['edu']},
                            {'criterion': 'Kỹ năng mềm & phù hợp', 'weight': 0.15, 'score': 88.0, 'comment': 'Đánh giá phù hợp văn hóa doanh nghiệp'}
                        ],
                        'strengths': cdata['strengths'],
                        'gaps': cdata['gaps'],
                        'recommendation': cdata['rec']
                    },
                    status=cdata['status']
                )
                session.add(app)
                await session.flush()
                saved_apps[cdata['name']] = (cand, app)
            else:
                app = (await session.execute(select(Application).where(Application.candidate_id == cand.id))).scalars().first()
                saved_apps[cdata['name']] = (cand, app)

        # 5. Interviews & Evaluations
        if 'Nguyễn Văn An' in saved_apps:
            cand_an, app_an = saved_apps['Nguyễn Văn An']
            existing_itv = (await session.execute(select(Interview).where(Interview.application_id == app_an.id))).scalar_one_or_none()
            if not existing_itv:
                itv1 = Interview(
                    company_id=comp.id,
                    application_id=app_an.id,
                    interviewer_id=user.id,
                    title='Phỏng vấn Chuyên môn Kỹ thuật AI - Nguyễn Văn An',
                    round_number=1,
                    format='online',
                    meeting_link='https://meet.google.com/rec-demo-an2026',
                    scheduled_time=datetime.now(timezone.utc) + timedelta(days=2, hours=3),
                    duration_minutes=60,
                    confirmation_status='confirmed',
                    ai_suggested_questions=[
                        {'question': 'Bạn hãy mô tả một thử thách lớn nhất khi thiết kế pipeline RAG và cách bạn giải quyết bài toán context length?', 'category': 'technical', 'rationale': 'Kiểm tra kiến thức chuyên sâu về LLM retrieval', 'expected_answer_points': ['Chunking strategy', 'Reranking', 'Vector similarity metric']},
                        {'question': 'Khi xử lý bất đồng bộ hàng đợi Celery bị tắc nghẽn, bạn debug và khôi phục hệ thống như thế nào?', 'category': 'problem_solving', 'rationale': 'Đánh giá khả năng xử lý sự cố production', 'expected_answer_points': ['Dead letter queue', 'Worker concurrency', 'Prefetch multiplier']}
                    ]
                )
                session.add(itv1)

        if 'Đặng Quốc Huy' in saved_apps:
            cand_huy, app_huy = saved_apps['Đặng Quốc Huy']
            existing_itv2 = (await session.execute(select(Interview).where(Interview.application_id == app_huy.id))).scalar_one_or_none()
            if not existing_itv2:
                itv2 = Interview(
                    company_id=comp.id,
                    application_id=app_huy.id,
                    interviewer_id=user.id,
                    title='Phỏng vấn Hệ thống & DevOps - Đặng Quốc Huy',
                    round_number=1,
                    format='online',
                    meeting_link='https://meet.google.com/rec-demo-huy2026',
                    scheduled_time=datetime.now(timezone.utc) - timedelta(days=1),
                    duration_minutes=45,
                    confirmation_status='confirmed',
                    ai_suggested_questions=[
                        {'question': 'Khi Kubernetes cluster xảy ra hiện tượng OOMKilled trên worker pods, bạn điều tra nguyên nhân theo những bước nào?', 'category': 'technical', 'rationale': 'Kỹ năng vận hành Kubernetes chuyên sâu', 'expected_answer_points': ['kubectl describe pod', 'Resource limits and requests', 'cgroups memory leak']},
                        {'question': 'Làm thế nào để thiết lập quy trình Zero-downtime deployment cho microservices?', 'category': 'architecture', 'rationale': 'Đánh giá thiết kế hệ thống có tính sẵn sàng cao', 'expected_answer_points': ['Rolling update', 'Readiness probes', 'Canary release']}
                    ]
                )
                session.add(itv2)
                await session.flush()

                eval_huy = InterviewEvaluation(
                    interview_id=itv2.id,
                    application_id=app_huy.id,
                    interviewer_id=user.id,
                    manual_score=8.8,
                    manual_rubric_scores=[
                        {'criterion': 'Kiến thức Kubernetes & Cloud', 'score': 9.0, 'comment': 'Nắm rất chắc kiến trúc cluster và quản lý tài nguyên'},
                        {'criterion': 'Kinh nghiệm CI/CD', 'score': 8.5, 'comment': 'Xây dựng pipeline tự động hóa tốt'},
                        {'criterion': 'Khả năng xử lý sự cố', 'score': 9.0, 'comment': 'Tư duy logic mạch lạc, phương pháp debug bài bản'},
                        {'criterion': 'Giao tiếp & Làm việc nhóm', 'score': 8.5, 'comment': 'Trình bày rõ ràng, thái độ cầu tiến'}
                    ],
                    manual_notes='Ứng viên trả lời rất lưu loát các câu hỏi tình huống thực tế về hạ tầng AWS và Kubernetes.',
                    candidate_audio_consent='yes',
                    transcript=[
                        {'speaker': 'Interviewer (HR)', 'start_time': 0.0, 'end_time': 12.0, 'text': 'Chào anh Huy, cảm ơn anh đã tham gia buổi phỏng vấn vị trí DevOps Lead hôm nay.'},
                        {'speaker': 'Candidate', 'start_time': 13.0, 'end_time': 45.0, 'text': 'Chào anh, tôi có 4 năm kinh nghiệm quản trị hạ tầng đám mây AWS và điều phối container với Kubernetes.'},
                        {'speaker': 'Interviewer (Tech Lead)', 'start_time': 46.0, 'end_time': 68.0, 'text': 'Anh có thể giải thích cách cấu hình HPA và tối ưu chi phí hạ tầng trên EKS?'},
                        {'speaker': 'Candidate', 'start_time': 69.0, 'end_time': 120.0, 'text': 'Tôi kết hợp Karpenter để autoscaling node linh hoạt dựa trên Spot Instances, kèm theo HPA dựa trên custom metrics từ Prometheus.'}
                    ],
                    ai_rating=8.9,
                    ai_summary='Ứng viên thể hiện hiểu biết sâu sắc về kiến trúc đám mây, tối ưu hóa chi phí với Karpenter và Spot instances trên Kubernetes.',
                    ai_rubric_scores=[
                        {'criterion': 'Technical Expertise', 'score': 9.0},
                        {'criterion': 'Problem Solving', 'score': 8.8},
                        {'criterion': 'System Reliability', 'score': 9.0}
                    ],
                    ai_strengths=['Kiến thức chuyên sâu về Karpenter & Kubernetes', 'Tư duy tối ưu chi phí thực tế'],
                    ai_weaknesses=['Cần củng cố thêm về bảo mật mạng nâng cao (eBPF)'],
                    ai_recommendation='Pass'
                )
                session.add(eval_huy)

        # 6. Email Logs
        existing_email = (await session.execute(select(EmailLog).where(EmailLog.recipient_email == 'an.nguyen@example.com'))).scalar_one_or_none()
        if not existing_email and 'Nguyễn Văn An' in saved_apps:
            cand_an, app_an = saved_apps['Nguyễn Văn An']
            email_log1 = EmailLog(
                company_id=comp.id,
                candidate_id=cand_an.id,
                application_id=app_an.id,
                email_type='invitation',
                template_name='interview_invitation',
                recipient_email='an.nguyen@example.com',
                recipient_name='Nguyễn Văn An',
                subject='[AI Recruiting Demo Corp] Thư mời phỏng vấn - Vị trí Senior Python AI Engineer',
                body_html='<p>Chào bạn An, chúng tôi trân trọng mời bạn tham gia phỏng vấn chuyên môn kỹ thuật AI.</p>',
                status='sent',
                sent_at=datetime.now(timezone.utc) - timedelta(hours=5),
                tracking_token=str(uuid.uuid4())
            )
            session.add(email_log1)

        await session.commit()
        print('=== ALL REAL PRODUCTION DATA POPULATED TO DATABASE SUCCESSFULLY! ===')


if __name__ == '__main__':
    asyncio.run(seed_full_real_data())
