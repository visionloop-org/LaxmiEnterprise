from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AttendanceRecordBase(BaseModel):
    sessionId: str
    employeeId: str
    status: str  # on_time, arrived, absent
    arrivalTime: Optional[datetime] = None
    recordedBy: str
    remarks: Optional[str] = None
    version: int = 1

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordUpdate(BaseModel):
    status: Optional[str] = None
    arrivalTime: Optional[datetime] = None
    remarks: Optional[str] = None
    version: Optional[int] = None

class AttendanceRecord(AttendanceRecordBase):
    id: Optional[str] = None
    recordedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
