from fastapi import APIRouter, Depends, status
from datetime import datetime, timezone
from app.models.assignment import VehicleAssignmentResponse, VehicleAssignmentCreate, VehicleAssignmentUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from app.core.exceptions import NotFoundException, ConflictException, ValidationException

router = APIRouter()

async def get_vehicle_capacity(session_id: str, vehicle_id: str) -> dict:
    active_assignments = await db.db.vehicle_assignments.find({
        "sessionId": session_id,
        "vehicleId": vehicle_id,
        "unassignedAt": None
    }).to_list(length=100)
    
    employee_ids = [a["employeeId"] for a in active_assignments]
    employees = await db.db.employees.find({"employeeId": {"$in": employee_ids}}).to_list(length=100)
    employee_map = {e["employeeId"]: e for e in employees}
    
    capacity = {
        "driver": 0,
        "chalan_man": 0,
        "worker": 0,
        "extra_labour": 0,
        "total": 0
    }
    
    for assignment in active_assignments:
        employee = employee_map.get(assignment["employeeId"])
        if employee:
            category = employee.get("category", "").lower()
            if "driver" in category:
                capacity["driver"] += 1
            elif "chalan" in category:
                capacity["chalan_man"] += 1
            elif "worker" in category or "labour" in category:
                capacity["worker"] += 1
            capacity["total"] += 1
    
    return capacity

async def validate_assignment_rules(session_id: str, vehicle_id: str, employee_id: str) -> tuple[bool, str, str]:
    """Validate assignment business rules, returning (is_valid, error_code, error_message)"""
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        return False, "SESSION_NOT_FOUND", f"Session '{session_id}' not found"
    
    if session.get("status") == "finalized":
        return False, "SESSION_FINALIZED_LOCKED", "Cannot modify assignments for finalized session"
    
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        return False, "EMPLOYEE_NOT_FOUND", f"Employee '{employee_id}' not found"
    
    attendance = await db.db.attendance_records.find_one({
        "sessionId": session_id,
        "employeeId": employee_id
    })
    
    if not attendance or attendance.get("status") == "absent":
        return False, "EMPLOYEE_ABSENT", "Cannot assign absent employee to vehicle"
    
    vehicle = await db.db.vehicles.find_one({"$or": [{"vehicleNumber": vehicle_id}, {"vehicleId": vehicle_id}]})
    if not vehicle:
        return False, "VEHICLE_NOT_FOUND", f"Vehicle '{vehicle_id}' not found"
    
    if not vehicle.get("active", True):
        return False, "VEHICLE_INACTIVE", "Vehicle is not active"
    
    if vehicle.get("status") == "Maintenance" or vehicle.get("status") == "maintenance":
        return False, "VEHICLE_UNDER_MAINTENANCE", "Vehicle is under maintenance"
    
    current_capacity = await get_vehicle_capacity(session_id, vehicle_id)
    
    existing_assignment = await db.db.vehicle_assignments.find_one({
        "sessionId": session_id,
        "employeeId": employee_id,
        "vehicleId": vehicle_id,
        "unassignedAt": None
    })
    
    if existing_assignment:
        return False, "ALREADY_ASSIGNED", "Employee is already assigned to this vehicle"
    
    category = employee.get("category", "").lower()
    
    if "driver" in category and current_capacity["driver"] >= 1:
        return False, "DRIVER_LIMIT_EXCEEDED", "Vehicle already has a driver assigned (max 1)"
    
    if "chalan" in category and current_capacity["chalan_man"] >= 1:
        return False, "CHALAN_LIMIT_EXCEEDED", "Vehicle already has a chalan man assigned (max 1)"
    
    if ("worker" in category or "labour" in category) and current_capacity["worker"] >= 6:
        return False, "WORKER_LIMIT_EXCEEDED", "Vehicle already has maximum workers assigned (max 6)"
    
    if current_capacity["total"] >= 8:
        return False, "CAPACITY_LIMIT_EXCEEDED", "Vehicle already at maximum capacity (max 8 employees)"
    
    return True, "", ""

@router.post("/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", response_model=VehicleAssignmentResponse, status_code=status.HTTP_201_CREATED, operation_id="assign_vehicle")
async def assign_vehicle(
    session_id: str,
    vehicle_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    is_valid, error_code, error_message = await validate_assignment_rules(session_id, vehicle_id, employee_id)
    if not is_valid:
        if "NOT_FOUND" in error_code:
            raise NotFoundException(message=error_message, code=error_code)
        elif "LIMIT_EXCEEDED" in error_code or "ALREADY_ASSIGNED" in error_code:
            raise ConflictException(message=error_message, code=error_code)
        else:
            raise ValidationException(message=error_message, code=error_code)
    
    now = datetime.now(timezone.utc)
    assignment_data = {
        "sessionId": session_id,
        "vehicleId": vehicle_id,
        "employeeId": employee_id,
        "assignedAt": now,
        "assignedBy": username,
        "unassignedAt": None,
        "unassignedBy": None
    }
    
    result = await db.db.vehicle_assignments.insert_one(assignment_data)
    created_assignment = await db.db.vehicle_assignments.find_one({"_id": result.inserted_id})
    
    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "assign_vehicle",
        "entityType": "vehicle_assignment",
        "entityId": str(result.inserted_id),
        "newValue": assignment_data,
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return created_assignment

@router.delete("/sessions/{session_id}/employees/{employee_id}", response_model=VehicleAssignmentResponse, operation_id="unassign_vehicle")
async def unassign_vehicle(
    session_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")
    
    if session.get("status") == "finalized":
        raise ValidationException(message="Cannot modify assignments for finalized session", code="SESSION_FINALIZED_LOCKED")
    
    assignment = await db.db.vehicle_assignments.find_one({
        "sessionId": session_id,
        "employeeId": employee_id,
        "unassignedAt": None
    })
    
    if not assignment:
        raise NotFoundException(message=f"No active vehicle assignment found for employee '{employee_id}' in session '{session_id}'", code="ASSIGNMENT_NOT_FOUND")
    
    now = datetime.now(timezone.utc)
    await db.db.vehicle_assignments.update_one(
        {"_id": assignment["_id"]},
        {
            "$set": {
                "unassignedAt": now,
                "unassignedBy": username
            }
        }
    )
    
    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "unassign_vehicle",
        "entityType": "vehicle_assignment",
        "entityId": str(assignment["_id"]),
        "previousValue": assignment,
        "newValue": {
            "unassignedAt": now,
            "unassignedBy": username
        },
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return await db.db.vehicle_assignments.find_one({"_id": assignment["_id"]})

@router.get("/sessions/{session_id}/vehicles/{vehicle_id}", response_model=list[VehicleAssignmentResponse], operation_id="get_vehicle_assignments")
async def get_vehicle_assignments(
    session_id: str,
    vehicle_id: str,
    username: str = Depends(get_current_active_user)
):
    cursor = db.db.vehicle_assignments.find({
        "sessionId": session_id,
        "vehicleId": vehicle_id,
        "unassignedAt": None
    })
    return await cursor.to_list(length=100)

@router.get("/sessions/{session_id}/employees/{employee_id}", response_model=VehicleAssignmentResponse, operation_id="get_employee_assignment")
async def get_employee_assignment(
    session_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    assignment = await db.db.vehicle_assignments.find_one({
        "sessionId": session_id,
        "employeeId": employee_id,
        "unassignedAt": None
    })
    if not assignment:
        raise NotFoundException(message=f"No active vehicle assignment found for employee '{employee_id}'", code="ASSIGNMENT_NOT_FOUND")
    return assignment
