from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AttendanceRecordBase(BaseModel):
    sessionId: str
    employeeId: str
    status: str  # on_time, arrived, absent
    arrivalTime: Optional[datetime] = None
    recordedBy: str
    remarks: Optional[str] = None
    version: int = 1
    hoursWorked: float = 8.0
    extraHours: float = 0.0
    basePay: Optional[float] = 0.0
    extraDutyPay: Optional[float] = 0.0
    totalPay: Optional[float] = 0.0

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordUpdate(BaseModel):
    status: Optional[str] = None
    arrivalTime: Optional[datetime] = None
    remarks: Optional[str] = None
    version: Optional[int] = None
    hoursWorked: Optional[float] = None
    extraHours: Optional[float] = None
    basePay: Optional[float] = None
    extraDutyPay: Optional[float] = None
    totalPay: Optional[float] = None

class AttendanceRecordResponse(AttendanceRecordBase):
    id: Optional[str] = Field(None, alias="_id")
    recordedAt: datetime = Field(default_factory=utc_now)

    @field_validator('id', mode='before')
    @classmethod
    def parse_id(cls, v):
        if v is None:
            return None
        return str(v)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AttendanceRecord(AttendanceRecordResponse):
    pass
