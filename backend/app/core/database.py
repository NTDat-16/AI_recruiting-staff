import os
import sys
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger("app.database")

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


def import_all_models() -> None:
    """Import tất cả các ORM models để đảm bảo Base.metadata nhận diện toàn bộ bảng."""
    import app.modules.auth.models  # noqa: F401
    import app.modules.job_posting.models  # noqa: F401
    import app.modules.candidate.models  # noqa: F401
    import app.modules.interview.models  # noqa: F401
    import app.modules.evaluation.models  # noqa: F401
    import app.modules.email.models  # noqa: F401


async def init_db() -> None:
    """
    Khởi tạo và kiểm tra kết nối CSDL, tạo các bảng nếu chưa có,
    và ghi log thông báo chi tiết khi kết nối thành công.
    """
    import_all_models()
    import app.core.database as db_mod
    target_metadata = db_mod.Base.metadata

    sanitized_url = DB_URL
    if "@" in sanitized_url:
        prefix = sanitized_url.split("://")[0]
        host_and_db = sanitized_url.split("@")[-1]
        sanitized_url = f"{prefix}://***:***@{host_and_db}"

    logger.info("⏳ Đang kết nối tới database: %s ...", sanitized_url)
    try:
        async with async_engine.begin() as conn:
            # Truy vấn kiểm tra kết nối thực tế
            result = await conn.execute(text("SELECT current_database(), version();"))
            row = result.fetchone()
            db_name = row[0] if row else "unknown"
            pg_ver = row[1].split()[0] if row and len(row) > 1 else ""

            logger.info("============================================================")
            logger.info("🚀 KẾT NỐI DATABASE THÀNH CÔNG!")
            logger.info("   - Database: %s", db_name)
            logger.info("   - Engine: %s (%s)", async_engine.name, pg_ver)
            logger.info("   - URL: %s", sanitized_url)

            # Tự động tạo các bảng nếu chưa có
            await conn.run_sync(target_metadata.create_all)
            table_names = list(target_metadata.tables.keys())
            logger.info("📦 Danh sách bảng CSDL đã sẵn sàng (%d bảng):", len(table_names))
            for tbl in table_names:
                logger.info("   • %s", tbl)
            logger.info("============================================================")
    except Exception as e:
        logger.error("❌ KẾT NỐI DATABASE THẤT BẠI: %s", str(e), exc_info=True)
        raise


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


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s")
    asyncio.run(init_db())
