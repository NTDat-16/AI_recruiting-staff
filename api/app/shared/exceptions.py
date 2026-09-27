from fastapi import HTTPException, status


class DomainException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(DomainException):
    def __init__(self, entity: str, entity_id: str = ""):
        detail = f"{entity} not found" if not entity_id else f"{entity} with ID {entity_id} not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class PermissionDeniedException(DomainException):
    def __init__(self, detail: str = "Permission denied for this operation"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(DomainException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnauthorizedException(DomainException):
    def __init__(self, detail: str = "Invalid authentication credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )


class AIServiceException(DomainException):
    def __init__(self, detail: str = "AI service processing failed"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)
