from app.workers.celery_app import celery_app
from app.workers.tasks_cv_scoring import task_score_candidate_cv
from app.workers.tasks_interview_analysis import task_analyze_interview_audio
from app.workers.tasks_bulk_email import task_dispatch_bulk_emails

__all__ = [
    "celery_app",
    "task_score_candidate_cv",
    "task_analyze_interview_audio",
    "task_dispatch_bulk_emails",
]
