from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    employeeId: str
    name: str
    category: str  # Workers, Drivers, Chalan Men, Office, Extra Labour
    photoPath: Optional[str] = None
    displayOrder: Optional[int] = None
    status: str = "active"  # active, inactive
    contractor: Optional[str] = None
    remarks: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    photoPath: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None
    contractor: Optional[str] = None
    remarks: Optional[str] = None

class Employee(EmployeeBase):
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
