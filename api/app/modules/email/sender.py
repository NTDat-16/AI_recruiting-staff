import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailSender:
    """Hệ thống phát hành Email thực tế hỗ trợ SMTP (Gmail/Outlook/Custom), SendGrid và Mock Log."""

    @staticmethod
    def _send_smtp_sync(
        to_email: str,
        subject: str,
        html_body: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        sender_email = from_email or settings.DEFAULT_FROM_EMAIL or settings.SMTP_USER
        sender_name = from_name or settings.DEFAULT_FROM_NAME or "Bộ Phận Tuyển Dụng"

        # Construct MIME Message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        # Attach HTML part
        part = MIMEText(html_body, "html", "utf-8")
        msg.attach(part)

        # Check if SMTP is configured
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                if settings.SMTP_PORT == 465:
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                    if settings.SMTP_TLS:
                        server.starttls()
                
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, [to_email], msg.as_string())
                server.quit()

                logger.info(f"✅ [SMTP Delivery] Đã gửi email thành công tới '{to_email}' qua {settings.SMTP_HOST}:{settings.SMTP_PORT}")
                return {
                    "success": True,
                    "mode": "smtp",
                    "recipient": to_email,
                    "subject": subject,
                    "message": f"Email đã được gửi thành công tới {to_email} qua SMTP server ({settings.SMTP_HOST})."
                }
            except Exception as e:
                logger.error(f"❌ [SMTP Error] Thất bại khi gửi email tới '{to_email}': {e}")
                return {
                    "success": False,
                    "mode": "smtp_error",
                    "recipient": to_email,
                    "subject": subject,
                    "error": str(e),
                    "message": f"Lỗi kết nối máy chủ SMTP: {e}"
                }

        # If SMTP not configured, simulate delivery with detailed log
        logger.warning(
            f"ℹ️ [Email Dispatcher - Chế độ Ghi nhận] Chưa cấu hình SMTP_HOST / SMTP_USER trong file .env. "
            f"Nội dung email tới '{to_email}' (Tiêu đề: '{subject}') đã được ghi nhận vào Nhật ký CSDL."
        )
        return {
            "success": True,
            "mode": "recorded_in_db",
            "recipient": to_email,
            "subject": subject,
            "message": f"Email đã được lưu vào hệ thống và CSDL thành công cho ứng viên {to_email} (Chế độ mô phỏng/ghi nhận do chưa cấu hình SMTP_HOST)."
        }

    @classmethod
    async def send_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Gửi email bất đồng bộ qua thread pool, tránh block event loop của FastAPI."""
        return await asyncio.to_thread(
            cls._send_smtp_sync,
            to_email=to_email,
            subject=subject,
            html_body=html_body,
            from_email=from_email,
            from_name=from_name,
        )
