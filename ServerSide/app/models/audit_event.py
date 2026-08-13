from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AuditEventBase(BaseModel):
    sessionId: str
    actorId: str
    action: str
    entityType: str  # attendance_session, attendance_record, vehicle_assignment, vehicle_trip
    entityId: str
    previousValue: Optional[Dict[str, Any]] = None
    newValue: Optional[Dict[str, Any]] = None

class AuditEventCreate(AuditEventBase):
    pass

class AuditEvent(AuditEventBase):
    id: Optional[str] = Field(None, alias="_id")
    createdAt: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
