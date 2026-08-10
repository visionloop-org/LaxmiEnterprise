from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class AttendanceSessionBase(BaseModel):
    sessionDate: str  # ISO date string YYYY-MM-DD
    shift: str  # morning, evening, night
    status: str = "in_progress"  # in_progress, finalized
    supervisorId: str
    version: int = 1

class AttendanceSessionCreate(AttendanceSessionBase):
    pass

class AttendanceSessionUpdate(BaseModel):
    status: Optional[str] = None
    supervisorId: Optional[str] = None
    version: Optional[int] = None

class AttendanceSession(AttendanceSessionBase):
    id: Optional[str] = Field(None, alias="_id")
    finalizedAt: Optional[datetime] = None
    finalizedBy: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('id', mode='before')
    @classmethod
    def parse_id(cls, v):
        if v is None:
            return None
        return str(v)

    class Config:
        from_attributes = True
        populate_by_name = True
