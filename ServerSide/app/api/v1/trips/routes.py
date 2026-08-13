from fastapi import APIRouter, Depends, status
from typing import List, Optional
from app.models.trip import VehicleTripResponse, VehicleTripCreate, VehicleTripUpdateStatus
from app.services.trip_service import TripService
from core.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=VehicleTripResponse, status_code=status.HTTP_201_CREATED, operation_id="create_trip")
async def create_trip(
    trip: VehicleTripCreate,
    username: str = Depends(get_current_active_user)
):
    return await TripService.create_trip(trip, actor=username)

@router.get("/", response_model=List[VehicleTripResponse], operation_id="list_trips")
async def list_trips(
    session_id: Optional[str] = None,
    vehicle_id: Optional[str] = None,
    status: Optional[str] = None,
    username: str = Depends(get_current_active_user)
):
    return await TripService.list_trips(session_id=session_id, vehicle_id=vehicle_id, status=status)

@router.get("/{trip_id}", response_model=VehicleTripResponse, operation_id="get_trip")
async def get_trip(
    trip_id: str,
    username: str = Depends(get_current_active_user)
):
    return await TripService.get_trip(trip_id)

@router.put("/{trip_id}/status", response_model=VehicleTripResponse, operation_id="update_trip_status")
async def update_trip_status(
    trip_id: str,
    payload: VehicleTripUpdateStatus,
    username: str = Depends(get_current_active_user)
):
    return await TripService.update_trip_status(trip_id, payload, actor=username)
