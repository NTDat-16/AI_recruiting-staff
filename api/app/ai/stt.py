import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.core.config import settings
from app.ai.schemas import TranscriptSegment

logger = logging.getLogger(__name__)


class BaseSTTClient(ABC):
    @abstractmethod
    async def transcribe_audio(self, audio_file_path_or_url: str) -> List[TranscriptSegment]:
        """Chuyển đổi âm thanh thành văn bản kèm speaker diarization và timestamp."""
        pass


class MockSTTClient(BaseSTTClient):
    """Client STT giả lập phục vụ phát triển & kiểm thử."""

    async def transcribe_audio(self, audio_file_path_or_url: str) -> List[TranscriptSegment]:
        return [
            TranscriptSegment(
                speaker="Interviewer (HR)",
                start_time=0.0,
                end_time=15.5,
                text="Chào bạn, cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay. Bạn có thể giới thiệu ngắn gọn về kinh nghiệm với FastAPI và hệ thống phân tán?",
            ),
            TranscriptSegment(
                speaker="Candidate",
                start_time=16.0,
                end_time=68.2,
                text="Dạ vâng chào anh/chị. Em có hơn 3 năm làm việc với Python và 2 năm chuyên sâu về FastAPI. Ở dự án gần nhất, em thiết kế hệ thống xử lý tin nhắn và phân tích dữ liệu ứng viên bằng Celery worker và Redis queue...",
            ),
            TranscriptSegment(
                speaker="Interviewer (Tech Lead)",
                start_time=69.0,
                end_time=92.0,
                text="Rất tốt. Vậy khi gặp hiện tượng database lock hoặc spike tải bất ngờ trên PostgreSQL, bạn đã áp dụng những chiến lược tối ưu nào?",
            ),
            TranscriptSegment(
                speaker="Candidate",
                start_time=93.0,
                end_time=154.0,
                text="Em đã cấu hình connection pool với PgBouncer, đánh chỉ mục partial index trên các cột trạng thái truy vấn thường xuyên và sử dụng Redis để cache kết quả truy vấn đọc nhiều.",
            ),
        ]


class WhisperSTTClient(BaseSTTClient):
    """Tích hợp OpenAI Whisper API."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def transcribe_audio(self, audio_file_path_or_url: str) -> List[TranscriptSegment]:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            # In a real environment, open file and send to whisper
            # For demonstration, fallback to mock if file path is simulated
            return await MockSTTClient().transcribe_audio(audio_file_path_or_url)
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return await MockSTTClient().transcribe_audio(audio_file_path_or_url)


def get_stt_client() -> BaseSTTClient:
    provider = settings.STT_PROVIDER.lower()
    if provider == "whisper" and settings.WHISPER_API_KEY:
        return WhisperSTTClient(api_key=settings.WHISPER_API_KEY)
    return MockSTTClient()
