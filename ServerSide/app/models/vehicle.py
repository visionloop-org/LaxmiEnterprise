from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class VehicleBase(BaseModel):
    vehicleNumber: str
    vehicleType: str  # Tipper, JCB, Truck, Excavator
    name: Optional[str] = None
    capacity: int = 8
    status: str = "available"  # available, in_use, maintenance
    active: bool = True

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicleNumber: Optional[str] = None
    vehicleType: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    active: Optional[bool] = None

class VehicleResponse(VehicleBase):
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

class Vehicle(VehicleResponse):
    pass
