import hashlib
import logging
from typing import List, Sequence
from app.core.config import settings
from app.shared.utils import cosine_similarity

logger = logging.getLogger(__name__)


class EmbeddingClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        if self.provider == "gemini":
            self.api_key = settings.GEMINI_API_KEY
            self.model = settings.GEMINI_EMBEDDING_MODEL
            self.base_url = settings.GEMINI_BASE_URL
        else:
            self.api_key = settings.OPENAI_API_KEY
            self.model = settings.OPENAI_EMBEDDING_MODEL
            self.base_url = None

    async def get_embedding(self, text: str) -> List[float]:
        """Tạo vector embedding cho một chuỗi văn bản."""
        if not text.strip():
            return [0.0] * 1536

        if self.api_key:
            try:
                from openai import AsyncOpenAI
                client_kwargs = {"api_key": self.api_key}
                if self.base_url:
                    client_kwargs["base_url"] = self.base_url
                client = AsyncOpenAI(**client_kwargs)
                response = await client.embeddings.create(
                    input=text,
                    model=self.model,
                )
                return response.data[0].embedding
            except Exception as e:
                logger.warning(f"{self.provider} embedding failed, fallback to deterministic vector: {e}")

        # Deterministic mock embedding for local/testing (1536 dimensions)
        return self._generate_pseudo_embedding(text)

    def _generate_pseudo_embedding(self, text: str, dim: int = 1536) -> List[float]:
        hash_val = hashlib.sha256(text.encode("utf-8")).digest()
        vector = []
        for i in range(dim):
            byte = hash_val[i % len(hash_val)]
            # Normalize to roughly -1.0 to 1.0
            vector.append(float((byte - 128) / 128.0))
        # Normalize vector length to 1.0
        norm = sum(x * x for x in vector) ** 0.5
        if norm > 0:
            vector = [x / norm for x in vector]
        return vector

    def compute_similarity(self, vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
        """Tính độ tương đồng cosine giữa hai vectors (0.0 đến 1.0)."""
        sim = cosine_similarity(vec_a, vec_b)
        # Scale from [-1, 1] to [0, 1] for percentage match
        return max(0.0, min(1.0, (sim + 1.0) / 2.0))


embedding_client = EmbeddingClient()
