#!/usr/bin/env python3
"""
Script trích xuất toàn bộ cấu trúc Schema và Dữ liệu thực tế từ PostgreSQL
thành file SQL độc lập (database/init.sql).

Đặc điểm an toàn:
1. Thêm `CREATE TABLE IF NOT EXISTS` và `CREATE INDEX IF NOT EXISTS`.
2. Thêm `ON CONFLICT DO NOTHING` cho các lệnh INSERT để không bao giờ ghi đè
   hay gây lỗi khóa chính (Primary Key Violation) nếu dữ liệu đã tồn tại.
3. Loại bỏ các cú pháp đặc thù cục bộ (\restrict) để tương thích 100% với
   mọi phiên bản PostgreSQL (15, 16, 17, 18) trong Docker container.
"""

import os
import sys
import re
import glob
import subprocess
from pathlib import Path

# Cấu hình UTF-8 cho Windows Console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

try:
    from app.core.config import settings
    from app.core.database import async_engine
    DB_USER = async_engine.url.username or "postgres"
    DB_PASS = async_engine.url.password or "postgres"
    DB_HOST = async_engine.url.host or "localhost"
    DB_PORT = str(async_engine.url.port or 5432)
    DB_NAME = async_engine.url.database or "Ai_Recruiting_Staff"
except Exception:
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASS = os.getenv("POSTGRES_PASSWORD", "141516")
    DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME = os.getenv("POSTGRES_DB", "Ai_Recruiting_Staff")


def find_pg_dump() -> str:
    """Tìm đường dẫn tệp thực thi pg_dump trên Windows hoặc Linux."""
    import shutil
    cli = shutil.which("pg_dump")
    if cli:
        return cli

    # Tìm kiếm trên Windows Program Files
    candidates = glob.glob(r"C:\Program Files\PostgreSQL\*\bin\pg_dump.exe")
    if candidates:
        # Chọn phiên bản mới nhất
        candidates.sort(reverse=True)
        return candidates[0]

    raise FileNotFoundError(
        "Không tìm thấy pg_dump trên máy tính. "
        "Vui lòng cài đặt PostgreSQL Client hoặc cấu hình PATH."
    )


def export_database(output_path: Path):
    pg_dump_bin = find_pg_dump()
    print(f"-> Tìm thấy pg_dump tại: {pg_dump_bin}")
    print(f"-> Đang kết nối tới DB: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}...")

    temp_dump = PROJECT_ROOT / "temp_raw_dump.sql"
    env = os.environ.copy()
    env["PGPASSWORD"] = str(DB_PASS)

    cmd = [
        pg_dump_bin,
        "-U", str(DB_USER),
        "-h", str(DB_HOST),
        "-p", str(DB_PORT),
        "--no-owner",
        "--no-acl",
        "--inserts",
        "-f", str(temp_dump),
        str(DB_NAME),
    ]

    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Lỗi khi chạy pg_dump: {res.stderr}")
        sys.exit(1)

    print("-> Đã trích xuất dữ liệu thô. Đang chuẩn hóa cú pháp an toàn (Idempotent SQL)...")

    with open(temp_dump, "r", encoding="utf-8") as f:
        lines = f.readlines()

    clean_lines = []
    for line in lines:
        # 1. Bỏ \restrict và transaction_timeout (chỉ có trên PG 17+)
        if line.strip().startswith("\\restrict") or line.strip().startswith("SET transaction_timeout"):
            continue
        # 2. CREATE TABLE IF NOT EXISTS
        if line.startswith("CREATE TABLE "):
            line = re.sub(r"CREATE TABLE (public\.[a-zA-Z0-9_]+)", r"CREATE TABLE IF NOT EXISTS \1", line)
        # 3. CREATE INDEX IF NOT EXISTS
        elif "CREATE INDEX " in line or "CREATE UNIQUE INDEX " in line:
            line = re.sub(r"CREATE (UNIQUE )?INDEX ([a-zA-Z0-9_]+) ON", r"CREATE \1INDEX IF NOT EXISTS \2 ON", line)
        # 4. INSERT INTO ... ON CONFLICT DO NOTHING;
        elif line.startswith("INSERT INTO ") and line.rstrip().endswith(");"):
            line = line.rstrip()[:-1] + " ON CONFLICT DO NOTHING;\n"

        clean_lines.append(line)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(clean_lines)

    if temp_dump.exists():
        temp_dump.unlink()

    file_size_kb = round(output_path.stat().st_size / 1024, 1)
    print(f"✓ XUẤT THÀNH CÔNG! File SQL đã được lưu tại: {output_path}")
    print(f"✓ Dung lượng tệp: {file_size_kb} KB ({len(clean_lines)} dòng)")
    print("✓ Toàn bộ bảng và bản ghi đã có cơ chế 'IF NOT EXISTS' và 'ON CONFLICT DO NOTHING'.")
    print("  -> Khi khởi động Docker lần đầu, file này tự nạp dữ liệu.")
    print("  -> Khi DB Docker đã có dữ liệu rồi, Docker sẽ KHÔNG chạy lại file này và bảo toàn dữ liệu 100%.")


if __name__ == "__main__":
    target = PROJECT_ROOT / "database" / "init.sql"
    export_database(target)
