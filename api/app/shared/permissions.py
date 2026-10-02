from enum import Enum
from typing import List, Optional
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.security import decode_access_token
from app.shared.exceptions import UnauthorizedException, PermissionDeniedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    HR = "hr"
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"


class TokenData:
    def __init__(self, user_id: str, email: str, role: str, company_id: Optional[str] = None):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.company_id = company_id


async def get_current_token_payload(token: Optional[str] = Depends(oauth2_scheme)) -> TokenData:
    if not token:
        raise UnauthorizedException("Authentication token is missing")
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
        company_id = payload.get("company_id")
        email = payload.get("email", "")
        if user_id is None:
            raise UnauthorizedException("Invalid token payload")
        return TokenData(user_id=user_id, email=email, role=role, company_id=company_id)
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")


async def get_optional_token_payload(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[TokenData]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
        company_id = payload.get("company_id")
        email = payload.get("email", "")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email, role=role, company_id=company_id)
    except Exception:
        return None


class RequireRoles:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]

    def __call__(self, current_user: TokenData = Depends(get_current_token_payload)) -> TokenData:
        if current_user.role not in self.allowed_roles:
            raise PermissionDeniedException(
                f"Role '{current_user.role}' is not authorized to access this resource. Required: {self.allowed_roles}"
            )
        return current_user
