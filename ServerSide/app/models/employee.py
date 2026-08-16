from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class EmployeeBase(BaseModel):
    employeeId: str
    name: str
    category: str  # Workers, Drivers, Chalan Men, Office, Extra Labour
    photoPath: Optional[str] = None
    displayOrder: Optional[int] = None
    status: str = "active"  # active, pending_approval, rejected, inactive
    phone: Optional[str] = None
    contractor: Optional[str] = None
    remarks: Optional[str] = None
    requestedBy: Optional[str] = None
    approvedBy: Optional[str] = None
    baseRate: Optional[float] = None  # Daily base pay rate in INR
    extraHours: Optional[float] = 0.0  # Extra duty hours
    incentive: Optional[float] = 0.0  # Daily incentive bonus in INR

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    photoPath: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    contractor: Optional[str] = None
    remarks: Optional[str] = None
    baseRate: Optional[float] = None
    extraHours: Optional[float] = None
    incentive: Optional[float] = None

class BulkCompensationItem(BaseModel):
    employeeId: str
    baseRate: Optional[float] = None
    extraHours: Optional[float] = None
    incentive: Optional[float] = None

class EmployeeResponse(EmployeeBase):
    id: Optional[str] = Field(None, alias="_id")
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    @field_validator('id', mode='before')
    @classmethod
    def parse_id(cls, v):
        if v is None:
            return None
        return str(v)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class Employee(EmployeeResponse):
    pass
