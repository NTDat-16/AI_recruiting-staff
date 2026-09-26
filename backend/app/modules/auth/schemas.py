from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class CompanyCreate(BaseModel):
    name: str
    tax_code: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    tax_code: Optional[str] = None
    subscription_plan: str
    contact_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None
    role: Optional[str] = "hr"
    department: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    company_id: Optional[str] = None
    full_name: str


class UserResponse(BaseModel):
    id: str
    company_id: Optional[str] = None
    full_name: str
    email: str
    role: str
    department: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
