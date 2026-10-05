import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Recruiting Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "super-secret-key-change-in-production-ai-recruiting-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recruiting_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/recruiting_db"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Storage (S3 / MinIO)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "recruiting-artifacts"
    S3_REGION: str = "us-east-1"

    # AI Providers Configuration
    LLM_PROVIDER: str = "anthropic"  # 'anthropic' | 'openai' | 'gemini' | 'mock'
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Gemini is called through Google's OpenAI-compatible endpoint.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    def model_post_init(self, __context: object) -> None:
        if not self.GEMINI_API_KEY and self.LLM_PROVIDER.lower() == "gemini" and self.OPENAI_API_KEY:
            self.GEMINI_API_KEY = self.OPENAI_API_KEY

    STT_PROVIDER: str = "whisper"  # 'whisper' | 'assemblyai' | 'mock'
    WHISPER_API_KEY: str = ""
    ASSEMBLYAI_API_KEY: str = ""

    # Email / SMTP Settings
    EMAIL_PROVIDER: str = "smtp"  # 'smtp' | 'sendgrid' | 'ses' | 'mock'
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SENDGRID_API_KEY: str = ""
    DEFAULT_FROM_EMAIL: str = "recruitment@ai-recruiting.internal"
    DEFAULT_FROM_NAME: str = "Bộ Phận Tuyển Dụng"

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
