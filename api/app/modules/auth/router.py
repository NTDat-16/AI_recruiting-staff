from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.modules.auth.service import AuthService
from app.shared.permissions import get_current_token_payload, TokenData

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Đăng ký tài khoản người dùng và doanh nghiệp."""
    user = await AuthService.register_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Đăng nhập hệ thống và lấy JWT access token."""
    return await AuthService.authenticate_user(db, data.email, data.password)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: TokenData = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Lấy thông tin tài khoản đang đăng nhập."""
    user = await AuthService.get_user_by_id(db, current_user.user_id)
    return user
