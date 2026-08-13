from typing import Any, Dict, Optional
from fastapi import status

class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details

class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_404_NOT_FOUND, details=details)

class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", code: str = "CONFLICT", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_409_CONFLICT, details=details)

class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", code: str = "VALIDATION_ERROR", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_400_BAD_REQUEST, details=details)

class AuthenticationException(AppException):
    def __init__(self, message: str = "Authentication failed", code: str = "UNAUTHORIZED", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_401_UNAUTHORIZED, details=details)

class ForbiddenException(AppException):
    def __init__(self, message: str = "Permission denied", code: str = "FORBIDDEN", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_403_FORBIDDEN, details=details)

class DatabaseException(AppException):
    def __init__(self, message: str = "Database operation failed", code: str = "DATABASE_ERROR", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, details=details)
