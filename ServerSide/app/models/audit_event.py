from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime

class AuditEventBase(BaseModel):
    sessionId: str
    actorId: str
    action: str
    entityType: str  # attendance_session, attendance_record, vehicle_assignment
    entityId: str
    previousValue: Optional[Dict[str, Any]] = None
    newValue: Optional[Dict[str, Any]] = None

class AuditEventCreate(AuditEventBase):
    pass

class AuditEvent(AuditEventBase):
    id: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
