from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modules.auth.models import User, Company
from app.modules.auth.schemas import UserRegister, CompanyCreate
from app.core.security import verify_password, get_password_hash, create_access_token
from app.shared.exceptions import BadRequestException, UnauthorizedException, NotFoundException


class AuthService:
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def register_user(db: AsyncSession, data: UserRegister) -> User:
        existing = await AuthService.get_user_by_email(db, data.email)
        if existing:
            raise BadRequestException("Email is already registered")

        company_id = data.company_id
        if not company_id and data.company_name:
            company = Company(name=data.company_name)
            db.add(company)
            await db.flush()
            company_id = company.id

        # Public self-registration must never grant elevated administrative roles.
        assigned_role = data.role if data.role in ["interviewer"] else "hr"

        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            company_id=company_id,
            role=assigned_role,
            department=data.department,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict:
        user = await AuthService.get_user_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password")
        if not user.is_active:
            raise BadRequestException("User account is inactive")

        token = create_access_token(
            subject=user.id,
            company_id=user.company_id,
            role=user.role,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id,
            "full_name": user.full_name,
        }
