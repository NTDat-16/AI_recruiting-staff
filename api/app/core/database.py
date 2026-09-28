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

def normalize_db_url(raw_url: str) -> tuple[str, dict]:
    """
    Chuẩn hóa kết nối CSDL bất đồng bộ (asyncpg) tuyệt đối an toàn.
    Loại bỏ dấu nháy, khoảng trắng, bóc tách query parameter không tương thích,
    và ép buộc driver postgresql+asyncpg để không bao giờ bị rơi về driver psycopg2 đồng bộ.
    """
    connect_args = {}
    if not raw_url:
        return "sqlite+aiosqlite:///./recruiting.db", connect_args

    url = str(raw_url).strip().strip("'\"").strip()

    # Bóc tách query parameter gây xung đột với asyncpg & kích hoạt SSL cho Cloud DB
    if "?" in url:
        base_part, query_part = url.split("?", 1)
        if any(token in query_part for token in ["sslmode", "ssl=true", "channel_binding"]) or "neon.tech" in base_part:
            connect_args["ssl"] = True
        url = base_part
    elif any(host in url for host in ["neon.tech", "amazonaws.com", "supabase.co"]):
        connect_args["ssl"] = True

    # Chuẩn hóa tiền tố giao thức sang postgresql+asyncpg
    if "://" in url:
        scheme, rest = url.split("://", 1)
        scheme_clean = scheme.strip().lower()
        if scheme_clean.startswith("sqlite"):
            url = f"sqlite+aiosqlite://{rest}"
        else:
            url = f"postgresql+asyncpg://{rest}"
    else:
        url = f"postgresql+asyncpg://{url}"

    return url, connect_args


# Async Engine setup
raw_db_source = os.getenv("DATABASE_URL") or settings.DATABASE_URL
if os.getenv("USE_SQLITE", "false").lower() == "true":
    DB_URL = "sqlite+aiosqlite:///./recruiting.db"
    SYNC_DB_URL = "sqlite:///./recruiting.db"
    connect_args = {}
else:
    DB_URL, connect_args = normalize_db_url(raw_db_source)
    SYNC_DB_URL = getattr(settings, "SYNC_DATABASE_URL", None) or DB_URL.replace("+asyncpg", "")

async_engine = create_async_engine(
    DB_URL,
    connect_args=connect_args,
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

            # Kích hoạt extension vector nếu sử dụng PostgreSQL
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            except Exception as ext_err:
                logger.warning("Không thể kích hoạt extension vector (có thể do quyền hạn hoặc SQLite): %s", ext_err)

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
