from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VehicleBase(BaseModel):
    vehicleNumber: str
    vehicleType: str  # Tipper, JCB, Truck, Excavator
    status: str = "available"  # available, in_use, maintenance
    active: bool = True

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicleNumber: Optional[str] = None
    vehicleType: Optional[str] = None
    status: Optional[str] = None
    active: Optional[bool] = None

class Vehicle(VehicleBase):
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
