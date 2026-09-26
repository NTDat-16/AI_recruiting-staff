import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class CalendarSyncService:
    @staticmethod
    async def create_calendar_event(
        title: str,
        start_time: datetime,
        duration_minutes: int,
        attendee_emails: list,
        description: str = "",
    ) -> Dict[str, Any]:
        """Tạo lịch phỏng vấn và link Google Meet / Teams đồng bộ với Calendar."""
        end_time = start_time + timedelta(minutes=duration_minutes)
        # Mocking calendar integration event with meeting link
        meeting_link = f"https://meet.google.com/rec-{start_time.strftime('%Y%m%d%H%M')}"
        logger.info(
            f"Calendar event created: '{title}' from {start_time} to {end_time} for {attendee_emails}. Link: {meeting_link}"
        )
        return {
            "event_id": f"cal_evt_{int(start_time.timestamp())}",
            "meeting_link": meeting_link,
            "status": "confirmed",
        }

    @staticmethod
    async def check_availability(
        interviewer_id: str,
        start_time: datetime,
        duration_minutes: int,
    ) -> bool:
        """Kiểm tra xem interviewer có bị trùng lịch trong khung giờ này hay không."""
        # Stub check; service layer queries db for overlapping interviews
        return True
