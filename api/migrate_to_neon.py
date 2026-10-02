import asyncio
import os
import sys
from pathlib import Path

# Ensure api directory is on sys.path
API_DIR = Path(__file__).resolve().parent
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.database import Base, import_all_models


def get_neon_async_url() -> str:
    raw_url = os.getenv("DATABASE_URL_UNPOOLED") or os.getenv("DATABASE_URL")
    if not raw_url:
        raise ValueError("DATABASE_URL_UNPOOLED or DATABASE_URL not found in .env")
    
    # Strip query parameters (sslmode, channel_binding) for asyncpg
    base_url = raw_url.split("?")[0]
    if base_url.startswith("postgres://"):
        base_url = base_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif base_url.startswith("postgresql://") and not base_url.startswith("postgresql+asyncpg://"):
        base_url = base_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return base_url


async def migrate_schema():
    db_url = get_neon_async_url()
    safe_host = db_url.split("@")[-1]
    print(f"Connecting to Neon Postgres at: {safe_host}")
    
    engine = create_async_engine(db_url, connect_args={"ssl": True}, echo=False)
    
    async with engine.begin() as conn:
        print("\n1. Enabling pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        res = await conn.execute(text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"))
        ext_info = res.fetchone()
        print(f"   Extension: {ext_info[0]} v{ext_info[1]}")
        
        print("\n2. Importing all SQLAlchemy models...")
        import_all_models()
        
        print("\n3. Creating tables in Neon database...")
        await conn.run_sync(Base.metadata.create_all)
        
        # Verify created tables
        query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
        tables_res = await conn.execute(query)
        tables = [r[0] for r in tables_res.fetchall()]
        
        print(f"\n4. Successfully verified {len(tables)} tables on Neon:")
        for t in tables:
            count_res = await conn.execute(text(f"SELECT COUNT(*) FROM public.\"{t}\";"))
            cnt = count_res.scalar()
            print(f"   • {t:<25} ({cnt} rows)")
            
    await engine.dispose()
    print("\n Schema migration to Neon completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate_schema())
