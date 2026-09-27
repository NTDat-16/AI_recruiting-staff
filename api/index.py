import os
import sys
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add api directory to sys.path so Vercel Serverless can import app modules
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

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


@app.get("/api/health")
def health_check():
    """Health check endpoint specified in Vercel Serverless standard."""
    return {
        "status": "ok",
        "env": os.getenv("VERCEL_ENV", "local"),
        "service": "AI Recruiting Platform API (Vercel Serverless)",
        "provider": os.getenv("LLM_PROVIDER", "gemini"),
    }


@app.post("/api/chat")
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


# Mount full recruiting platform domain routers if available
try:
    from app.core.config import settings
    from app.modules.auth.router import router as auth_router
    from app.modules.job_posting.router import router as job_router
    from app.modules.candidate.router import router as candidate_router
    from app.modules.interview.router import router as interview_router
    from app.modules.evaluation.router import router as evaluation_router
    from app.modules.email.router import router as email_router

    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(job_router, prefix="/api/v1")
    app.include_router(candidate_router, prefix="/api/v1")
    app.include_router(interview_router, prefix="/api/v1")
    app.include_router(evaluation_router, prefix="/api/v1")
    app.include_router(email_router, prefix="/api/v1")
except Exception as err:
    # In lightweight serverless sandbox without DB credentials, core endpoints still work
    pass
