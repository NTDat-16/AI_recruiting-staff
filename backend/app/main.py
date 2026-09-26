from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import async_engine, Base
from app.modules.auth.router import router as auth_router
from app.modules.job_posting.router import router as job_router
from app.modules.candidate.router import router as candidate_router
from app.modules.interview.router import router as interview_router
from app.modules.evaluation.router import router as evaluation_router
from app.modules.email.router import router as email_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto create tables on startup if in local dev
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Nền tảng website tuyển dụng ứng dụng AI - Hệ thống Backend Modular DDD-lite với FastAPI",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Domain Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(job_router, prefix=settings.API_V1_STR)
app.include_router(candidate_router, prefix=settings.API_V1_STR)
app.include_router(interview_router, prefix=settings.API_V1_STR)
app.include_router(evaluation_router, prefix=settings.API_V1_STR)
app.include_router(email_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Kiểm tra tình trạng hoạt động của API server."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "stt_provider": settings.STT_PROVIDER,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AI Recruiting Platform API is running.",
        "documentation": "/docs",
        "health": "/health",
    }
