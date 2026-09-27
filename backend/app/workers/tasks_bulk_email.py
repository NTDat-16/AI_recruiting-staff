import logging
from typing import List, Dict, Any
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.dispatch_bulk_emails", bind=True, max_retries=3, default_retry_delay=60)
def task_dispatch_bulk_emails(self, email_batch: List[Dict[str, Any]]):
    """Tác vụ nền Celery: Gửi email hàng loạt không làm chậm luồng request chính."""
    logger.info(f"[Celery] Bắt đầu phát hành {len(email_batch)} email hàng loạt")
    sent_count = 0
    try:
        from app.modules.email.sender import EmailSender
        for mail in email_batch:
            to_email = mail.get("recipient_email") or mail.get("to_email")
            subject = mail.get("subject", "Thông báo từ Ban Tuyển Dụng")
            html_body = mail.get("body_html", "")
            if to_email:
                EmailSender._send_smtp_sync(to_email=to_email, subject=subject, html_body=html_body)
                sent_count += 1
        return {
            "status": "success",
            "total_sent": sent_count,
        }
    except Exception as exc:
        logger.error(f"[Celery] Gặp lỗi trong quá trình gửi mail hàng loạt: {exc}")
        raise self.retry(exc=exc)
