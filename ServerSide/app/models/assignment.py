from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class VehicleAssignmentBase(BaseModel):
    sessionId: str
    employeeId: str
    vehicleId: str
    assignedAt: datetime = Field(default_factory=utc_now)
    assignedBy: str
    unassignedAt: Optional[datetime] = None
    unassignedBy: Optional[str] = None

class VehicleAssignmentCreate(VehicleAssignmentBase):
    pass

class VehicleAssignmentUpdate(BaseModel):
    vehicleId: Optional[str] = None
    unassignedAt: Optional[datetime] = None
    unassignedBy: Optional[str] = None

class VehicleAssignmentResponse(VehicleAssignmentBase):
    id: Optional[str] = Field(None, alias="_id")

    @field_validator('id', mode='before')
    @classmethod
    def parse_id(cls, v):
        if v is None:
            return None
        return str(v)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class VehicleAssignment(VehicleAssignmentResponse):
    pass
