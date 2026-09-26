import io
import logging
from typing import Tuple
from app.ai.llm_client import get_llm_client
from app.ai.schemas import ParsedCVSchema

logger = logging.getLogger(__name__)


class CVParser:
    @staticmethod
    def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
        """Trích xuất văn bản thô từ file PDF hoặc DOCX."""
        text = ""
        filename_lower = filename.lower()
        try:
            if filename_lower.endswith(".pdf"):
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        pages = [page.extract_text() or "" for page in pdf.pages]
                        text = "\n".join(pages)
                except Exception as e:
                    logger.warning(f"pdfplumber extraction failed: {e}")
                    text = file_bytes.decode("utf-8", errors="ignore")
            elif filename_lower.endswith(".docx"):
                try:
                    import docx
                    doc = docx.Document(io.BytesIO(file_bytes))
                    text = "\n".join([p.text for p in doc.paragraphs if p.text])
                except Exception as e:
                    logger.warning(f"docx extraction failed: {e}")
                    text = file_bytes.decode("utf-8", errors="ignore")
            else:
                # Text/markdown/etc
                text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            logger.error(f"Error parsing file {filename}: {e}")
            text = file_bytes.decode("utf-8", errors="ignore")

        return text.strip()

    @staticmethod
    async def parse_and_structure_cv(file_bytes: bytes, filename: str) -> Tuple[str, ParsedCVSchema]:
        """Trích xuất văn bản và gọi AI layer để chuẩn hóa thông tin ứng viên."""
        raw_text = CVParser.extract_text_from_bytes(file_bytes, filename)
        llm = get_llm_client()
        parsed_schema = await llm.parse_cv_text(raw_text)
        return raw_text, parsed_schema
