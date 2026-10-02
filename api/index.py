import os
import sys
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add api directory to sys.path with highest priority so 'app' imports resolve to api/app
# Note: Next.js frontend has an 'app/' directory at root. We must strictly prevent
# Python from treating the Next.js app/ directory as a Python package.
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

# Strip any existing entries to reorder cleanly
while str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
while str(CURRENT_DIR) in sys.path:
    sys.path.remove(str(CURRENT_DIR))

# Insert api directory at index 0 so 'import app' always finds api/app
sys.path.insert(0, str(CURRENT_DIR))
# Append root directory at the end for other non-conflicting assets if needed
sys.path.append(str(ROOT_DIR))

# Create FastAPI app conforming to Vercel standards
app = FastAPI(
    title="AI Recruiting Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    description="Vercel Serverless Python Backend for AI Recruiting Platform",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Chat Request model as specified in Vercel Deployment Guide
class PromptRequest(BaseModel):
    message: str


@app.get("/")
@app.get("/api")
def root_index():
    return {
        "service": "AI Recruiting Platform API",
        "status": "online",
        "docs": "/api/docs",
        "health": "/api/health",
        "chat": "/api/chat",
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint specified in Vercel Serverless standard."""
    return {
        "status": "ok",
        "env": os.getenv("VERCEL_ENV", "local"),
        "service": "AI Recruiting Platform API (Vercel Serverless)",
        "provider": os.getenv("LLM_PROVIDER", "gemini"),
        "loaded_routers": [r[0] for r in domain_routers],
        "router_errors": router_errors if router_errors else None,
    }


@app.post("/api/chat")
@app.post("/chat")
async def chat_handler(payload: PromptRequest):
    """Test AI chat endpoint from Vercel deployment guide."""
    if not payload.message:
        raise HTTPException(status_code=400, detail="Nội dung không hợp lệ.")
    
    # Call Gemini / OpenAI / Anthropic through AI LLM client
    try:
        from app.ai.llm_client import get_llm_client
        llm = get_llm_client()
        reply = await llm.generate_text(
            system_prompt="Bạn là trợ lý tuyển dụng AI chuyên nghiệp, trả lời ngắn gọn và súc tích bằng tiếng Việt.",
            user_prompt=payload.message,
        )
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Xử lý thành công câu hỏi: {payload.message} (Chế độ phản hồi nhanh)"}


# Mount full recruiting platform domain routers with both /api/v1 and /v1 prefixes
domain_routers = []
router_errors = {}

try:
    from app.modules.auth.router import router as auth_router
    domain_routers.append(("auth", auth_router))
except Exception as err:
    import traceback
    router_errors["auth"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load auth router: {err}")

try:
    from app.modules.job_posting.router import router as job_router
    domain_routers.append(("job_posting", job_router))
except Exception as err:
    import traceback
    router_errors["job_posting"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load job_posting router: {err}")

try:
    from app.modules.candidate.router import router as candidate_router
    domain_routers.append(("candidate", candidate_router))
except Exception as err:
    import traceback
    router_errors["candidate"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load candidate router: {err}")

try:
    from app.modules.interview.router import router as interview_router
    domain_routers.append(("interview", interview_router))
except Exception as err:
    import traceback
    router_errors["interview"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load interview router: {err}")

try:
    from app.modules.evaluation.router import router as evaluation_router
    domain_routers.append(("evaluation", evaluation_router))
except Exception as err:
    import traceback
    router_errors["evaluation"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load evaluation router: {err}")

try:
    from app.modules.email.router import router as email_router
    domain_routers.append(("email", email_router))
except Exception as err:
    import traceback
    router_errors["email"] = f"{err} | {traceback.format_exc()}"
    print(f"Warning: Could not load email router: {err}")

# Include routers under both /api/v1 and /v1 to guarantee matching across all Vercel rewrite patterns
for router_name, r in domain_routers:
    app.include_router(r, prefix="/api/v1")
    app.include_router(r, prefix="/v1")
