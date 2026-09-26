from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class JobPostingBase(BaseModel):
    title: str = Field(..., example="Senior Python/FastAPI Engineer")
    department: Optional[str] = Field(None, example="Engineering")
    location: Optional[str] = Field("Hà Nội / Remote", example="Hà Nội")
    salary_range: Optional[str] = Field(None, example="30,000,000 - 50,000,000 VND")
    description: str = Field(..., example="Phát triển hệ thống AI Backend...")
    requirements: str = Field(..., example="Ít nhất 3 năm kinh nghiệm Python, FastAPI...")
    ai_criteria_weights: Optional[Dict[str, float]] = Field(
        default={
            "required_skills": 0.40,
            "experience_years": 0.30,
            "education": 0.15,
            "domain_knowledge": 0.15,
        }
    )
    deadline: Optional[datetime] = None


class JobPostingCreate(JobPostingBase):
    pass


class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    ai_criteria_weights: Optional[Dict[str, float]] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None


class JobPostingResponse(JobPostingBase):
    id: str
    company_id: str
    slug: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublicJobPostingResponse(BaseModel):
    id: str
    title: str
    slug: str
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    description: str
    requirements: str
    deadline: Optional[datetime] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
