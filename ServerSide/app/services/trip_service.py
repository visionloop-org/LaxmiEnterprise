from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.db.mongodb import db
from app.models.trip import VehicleTripCreate, VehicleTripUpdateStatus
from app.core.exceptions import NotFoundException, ConflictException, ValidationException

STATUS_ALIASES = {
    "delivered_product": "delivered",
    "completed": "returned"
}

class TripService:
    @staticmethod
    def normalize_status(status: str) -> str:
        s = (status or "").lower().strip()
        return STATUS_ALIASES.get(s, s)

    @staticmethod
    async def create_trip(trip_data: VehicleTripCreate, actor: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        trip_id = f"TRIP-{now.strftime('%Y%m%d%H%M%S')}-{trip_data.vehicleNumber}"
        
        initial_status = TripService.normalize_status(trip_data.status or "dispatched")
        
        timeline_event = {
            "status": initial_status,
            "timestamp": now,
            "recordedBy": actor,
            "locationName": trip_data.destinationLocation,
            "remarks": trip_data.remarks or "Trip initialized and dispatched"
        }
        
        doc = trip_data.model_dump(exclude_none=True)
        doc["_id"] = trip_id
        doc["status"] = initial_status
        doc["dispatchedAt"] = now
        doc["dispatchedBy"] = actor
        doc["timeline"] = [timeline_event]
        doc["createdAt"] = now
        doc["updatedAt"] = now

        await db.db.vehicle_trips.insert_one(doc)
        
        # Log audit event
        audit_event = {
            "sessionId": trip_data.sessionId,
            "actorId": actor,
            "action": "create_vehicle_trip",
            "entityType": "vehicle_trip",
            "entityId": trip_id,
            "newValue": doc,
            "createdAt": now
        }
        await db.db.audit_events.insert_one(audit_event)

        return await db.db.vehicle_trips.find_one({"_id": trip_id})

    @staticmethod
    async def update_trip_status(trip_id: str, update_payload: VehicleTripUpdateStatus, actor: str) -> Dict[str, Any]:
        trip = await db.db.vehicle_trips.find_one({"_id": trip_id})
        if not trip:
            raise NotFoundException(message=f"Trip '{trip_id}' not found", code="TRIP_NOT_FOUND")

        now = datetime.now(timezone.utc)
        new_status = TripService.normalize_status(update_payload.status)

        valid_transitions = {
            "dispatched": ["reached_location", "delivered", "returned"],
            "reached_location": ["delivered", "returned"],
            "delivered": ["returned"],
            "returned": []
        }
        
        current_status = TripService.normalize_status(trip.get("status", "dispatched"))
        if current_status != new_status and new_status not in valid_transitions.get(current_status, []):
            raise ValidationException(
                message=f"Invalid trip status transition from '{current_status}' to '{new_status}'",
                code="INVALID_STATUS_TRANSITION"
            )

        timeline_event = {
            "status": new_status,
            "timestamp": now,
            "recordedBy": actor,
            "locationName": update_payload.locationName or trip.get("destinationLocation"),
            "receiverName": update_payload.receiverName or trip.get("receiverName"),
            "remarks": update_payload.remarks or f"Status updated to {new_status}"
        }

        updates: Dict[str, Any] = {
            "status": new_status,
            "updatedAt": now
        }

        if update_payload.receiverName:
            updates["receiverName"] = update_payload.receiverName

        if new_status == "reached_location" and not trip.get("reachedLocationAt"):
            updates["reachedLocationAt"] = now
        elif new_status == "delivered" and not trip.get("deliveredAt"):
            updates["deliveredAt"] = now
        elif new_status == "returned" and not trip.get("returnedAt"):
            updates["returnedAt"] = now

        await db.db.vehicle_trips.update_one(
            {"_id": trip_id},
            {
                "$set": updates,
                "$push": {"timeline": timeline_event}
            }
        )

        updated_trip = await db.db.vehicle_trips.find_one({"_id": trip_id})

        # Audit Event
        audit_event = {
            "sessionId": trip.get("sessionId", "N/A"),
            "actorId": actor,
            "action": f"update_trip_{new_status}",
            "entityType": "vehicle_trip",
            "entityId": trip_id,
            "previousValue": {"status": current_status},
            "newValue": {"status": new_status, "receiverName": update_payload.receiverName},
            "createdAt": now
        }
        await db.db.audit_events.insert_one(audit_event)

        return updated_trip

    @staticmethod
    async def list_trips(session_id: Optional[str] = None, vehicle_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {}
        if session_id:
            query["sessionId"] = session_id
        if vehicle_id:
            query["vehicleId"] = vehicle_id
        if status:
            query["status"] = TripService.normalize_status(status)

        cursor = db.db.vehicle_trips.find(query).sort("createdAt", -1)
        return await cursor.to_list(length=200)

    @staticmethod
    async def get_trip(trip_id: str) -> Dict[str, Any]:
        trip = await db.db.vehicle_trips.find_one({"_id": trip_id})
        if not trip:
            raise NotFoundException(message=f"Trip '{trip_id}' not found", code="TRIP_NOT_FOUND")
        return trip
