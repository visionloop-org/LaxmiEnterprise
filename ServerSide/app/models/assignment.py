from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VehicleAssignmentBase(BaseModel):
    sessionId: str
    employeeId: str
    vehicleId: str
    assignedAt: datetime = Field(default_factory=datetime.utcnow)
    assignedBy: str
    unassignedAt: Optional[datetime] = None
    unassignedBy: Optional[str] = None

class VehicleAssignmentCreate(VehicleAssignmentBase):
    pass

class VehicleAssignmentUpdate(BaseModel):
    vehicleId: Optional[str] = None
    unassignedAt: Optional[datetime] = None
    unassignedBy: Optional[str] = None

class VehicleAssignment(VehicleAssignmentBase):
    id: Optional[str] = None

    class Config:
        from_attributes = True
