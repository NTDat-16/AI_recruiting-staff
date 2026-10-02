from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "recruiting_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.tasks_cv_scoring",
        "app.workers.tasks_interview_analysis",
        "app.workers.tasks_bulk_email",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max for STT / LLM audio analysis
    worker_prefetch_multiplier=1,
)
