from fastapi import APIRouter, Depends, status
from typing import List, Optional
from app.models.vehicle import VehicleResponse, VehicleCreate, VehicleUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from datetime import datetime, timezone
from app.core.exceptions import NotFoundException, ConflictException

router = APIRouter()

@router.get("/", response_model=List[VehicleResponse], operation_id="list_vehicles")
async def list_vehicles(
    vehicle_type: Optional[str] = None,
    status: Optional[str] = None,
    active: Optional[bool] = None,
    username: str = Depends(get_current_active_user)
):
    query = {}
    if vehicle_type:
        query["vehicleType"] = vehicle_type
    if status:
        query["status"] = status
    if active is not None:
        query["active"] = active

    cursor = db.db.vehicles.find(query)
    return await cursor.to_list(length=100)

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, operation_id="create_vehicle")
async def create_vehicle(vehicle: VehicleCreate, username: str = Depends(get_current_active_user)):
    existing = await db.db.vehicles.find_one({"$or": [{"vehicleNumber": vehicle.vehicleNumber}, {"vehicleId": vehicle.vehicleNumber}]})
    if existing:
        raise ConflictException(message=f"Vehicle with number '{vehicle.vehicleNumber}' already exists", code="DUPLICATE_VEHICLE_NUMBER")

    vehicle_data = vehicle.dict()
    now = datetime.now(timezone.utc)
    vehicle_data["createdAt"] = now
    vehicle_data["updatedAt"] = now

    result = await db.db.vehicles.insert_one(vehicle_data)
    created_vehicle = await db.db.vehicles.find_one({"_id": result.inserted_id})

    return created_vehicle

@router.get("/{vehicle_number}", response_model=VehicleResponse, operation_id="get_vehicle")
async def get_vehicle(vehicle_number: str, username: str = Depends(get_current_active_user)):
    vehicle = await db.db.vehicles.find_one({"$or": [{"vehicleNumber": vehicle_number}, {"vehicleId": vehicle_number}]})
    if not vehicle:
        raise NotFoundException(message=f"Vehicle '{vehicle_number}' not found", code="VEHICLE_NOT_FOUND")
    return vehicle

@router.patch("/{vehicle_number}", response_model=VehicleResponse, operation_id="update_vehicle")
async def update_vehicle(
    vehicle_number: str,
    vehicle_update: VehicleUpdate,
    username: str = Depends(get_current_active_user)
):
    vehicle = await db.db.vehicles.find_one({"$or": [{"vehicleNumber": vehicle_number}, {"vehicleId": vehicle_number}]})
    if not vehicle:
        raise NotFoundException(message=f"Vehicle '{vehicle_number}' not found", code="VEHICLE_NOT_FOUND")

    update_data = vehicle_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.now(timezone.utc)

    await db.db.vehicles.update_one(
        {"_id": vehicle["_id"]},
        {"$set": update_data}
    )

    return await db.db.vehicles.find_one({"_id": vehicle["_id"]})
