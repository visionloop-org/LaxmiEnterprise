from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime

class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Any] = Field(None, description="Additional context or validation errors")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="ISO timestamp")
    path: Optional[str] = Field(None, description="Request URL path")
    requestId: Optional[str] = Field(None, description="Unique correlation request ID")

class APIErrorResponse(BaseModel):
    error: ErrorDetail
