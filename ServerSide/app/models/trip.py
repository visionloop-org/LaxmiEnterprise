from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TripTimelineEvent(BaseModel):
    status: str  # dispatched, reached_location, delivered, returned
    timestamp: datetime = Field(default_factory=utc_now)
    recordedBy: str
    locationName: Optional[str] = None
    remarks: Optional[str] = None

class VehicleTripBase(BaseModel):
    sessionId: str
    vehicleId: str
    vehicleNumber: str
    driverEmployeeId: Optional[str] = None
    driverName: Optional[str] = None
    destinationLocation: str
    productDetails: Optional[str] = "Material / Aggregate Delivery"
    status: str = "dispatched"  # dispatched, reached_location, delivered, returned
    remarks: Optional[str] = None

class VehicleTripCreate(VehicleTripBase):
    pass

class VehicleTripUpdateStatus(BaseModel):
    status: str
    locationName: Optional[str] = None
    remarks: Optional[str] = None

class VehicleTripResponse(VehicleTripBase):
    id: Optional[str] = Field(None, alias="_id")
    dispatchedAt: datetime = Field(default_factory=utc_now)
    dispatchedBy: str
    reachedLocationAt: Optional[datetime] = None
    deliveredAt: Optional[datetime] = None
    returnedAt: Optional[datetime] = None
    timeline: List[TripTimelineEvent] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    @field_validator('id', mode='before')
    @classmethod
    def parse_id(cls, v):
        if v is None:
            return None
        return str(v)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
