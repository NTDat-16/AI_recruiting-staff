import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

# Base class for SQLAlchemy models
Base = declarative_base()

# Async Engine setup
# If running locally without PostgreSQL container started yet, allow SQLite fallback for instant zero-dependency tests
DB_URL = settings.DATABASE_URL
if os.getenv("USE_SQLITE", "false").lower() == "true":
    DB_URL = "sqlite+aiosqlite:///./recruiting.db"
    SYNC_DB_URL = "sqlite:///./recruiting.db"
else:
    SYNC_DB_URL = settings.SYNC_DATABASE_URL

async_engine = create_async_engine(
    DB_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
