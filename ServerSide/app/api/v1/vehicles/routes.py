from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.vehicle import Vehicle, VehicleCreate, VehicleUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Vehicle])
async def list_vehicles(
    vehicle_type: str = None,
    status: str = None,
    active: bool = None,
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

@router.post("/", response_model=Vehicle)
async def create_vehicle(vehicle: VehicleCreate, username: str = Depends(get_current_active_user)):
    # Check if vehicleNumber already exists
    existing = await db.db.vehicles.find_one({"vehicleNumber": vehicle.vehicleNumber})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle with this number already exists"
        )
    
    vehicle_data = vehicle.dict()
    vehicle_data["createdAt"] = datetime.utcnow()
    vehicle_data["updatedAt"] = datetime.utcnow()
    
    result = await db.db.vehicles.insert_one(vehicle_data)
    created_vehicle = await db.db.vehicles.find_one({"_id": result.inserted_id})
    
    return created_vehicle

@router.get("/{vehicle_number}", response_model=Vehicle)
async def get_vehicle(vehicle_number: str, username: str = Depends(get_current_active_user)):
    vehicle = await db.db.vehicles.find_one({"vehicleNumber": vehicle_number})
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle

@router.patch("/{vehicle_number}", response_model=Vehicle)
async def update_vehicle(
    vehicle_number: str,
    vehicle_update: VehicleUpdate,
    username: str = Depends(get_current_active_user)
):
    vehicle = await db.db.vehicles.find_one({"vehicleNumber": vehicle_number})
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    update_data = vehicle_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.db.vehicles.update_one(
        {"vehicleNumber": vehicle_number},
        {"$set": update_data}
    )
    
    return await db.db.vehicles.find_one({"vehicleNumber": vehicle_number})
