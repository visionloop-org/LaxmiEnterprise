from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.models.assignment import VehicleAssignment, VehicleAssignmentCreate, VehicleAssignmentUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user

router = APIRouter()

async def get_vehicle_capacity(session_id: str, vehicle_id: str) -> dict:
    """Calculate current vehicle capacity usage"""
    active_assignments = await db.db.vehicle_assignments.find({
        "sessionId": session_id,
        "vehicleId": vehicle_id,
        "unassignedAt": None
    }).to_list(length=100)
    
    # Get employee categories for all assigned employees
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

async def validate_assignment_rules(session_id: str, vehicle_id: str, employee_id: str) -> tuple[bool, str]:
    """Validate assignment business rules"""
    # Check session exists and is not finalized
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        return False, "Session not found"
    
    if session["status"] == "finalized":
        return False, "Cannot modify assignments for finalized session"
    
    # Check employee exists and has attendance record (must be present)
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        return False, "Employee not found"
    
    attendance = await db.db.attendance_records.find_one({
        "sessionId": session_id,
        "employeeId": employee_id
    })
    
    if not attendance or attendance["status"] == "absent":
        return False, "Cannot assign absent employee to vehicle"
    
    # Check vehicle exists and is active
    vehicle = await db.db.vehicles.find_one({"vehicleNumber": vehicle_id})
    if not vehicle:
        return False, "Vehicle not found"
    
    if not vehicle.get("active", True):
        return False, "Vehicle is not active"
    
    if vehicle.get("status") == "maintenance":
        return False, "Vehicle is under maintenance"
    
    # Check capacity rules
    current_capacity = await get_vehicle_capacity(session_id, vehicle_id)
    
    # Check if employee is already assigned to this vehicle
    existing_assignment = await db.db.vehicle_assignments.find_one({
        "sessionId": session_id,
        "employeeId": employee_id,
        "vehicleId": vehicle_id,
        "unassignedAt": None
    })
    
    if existing_assignment:
        return False, "Employee already assigned to this vehicle"
    
    # Check capacity limits based on employee category
    category = employee.get("category", "").lower()
    
    if "driver" in category and current_capacity["driver"] >= 1:
        return False, "Vehicle already has a driver assigned (max 1)"
    
    if "chalan" in category and current_capacity["chalan_man"] >= 1:
        return False, "Vehicle already has a chalan man assigned (max 1)"
    
    if ("worker" in category or "labour" in category) and current_capacity["worker"] >= 6:
        return False, "Vehicle already has maximum workers assigned (max 6)"
    
    if current_capacity["total"] >= 8:
        return False, "Vehicle already at maximum capacity (max 8 employees)"
    
    return True, ""

@router.post("/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", response_model=VehicleAssignment)
async def assign_vehicle(
    session_id: str,
    vehicle_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    # Validate business rules
    is_valid, error_message = await validate_assignment_rules(session_id, vehicle_id, employee_id)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Create assignment
    assignment_data = {
        "sessionId": session_id,
        "vehicleId": vehicle_id,
        "employeeId": employee_id,
        "assignedAt": datetime.utcnow(),
        "assignedBy": username,
        "unassignedAt": None,
        "unassignedBy": None
    }
    
    result = await db.db.vehicle_assignments.insert_one(assignment_data)
    created_assignment = await db.db.vehicle_assignments.find_one({"_id": result.inserted_id})
    
    # Record audit event
    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "assign_vehicle",
        "entityType": "vehicle_assignment",
        "entityId": str(result.inserted_id),
        "newValue": assignment_data,
        "createdAt": datetime.utcnow()
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return created_assignment

@router.delete("/sessions/{session_id}/employees/{employee_id}", response_model=VehicleAssignment)
async def unassign_vehicle(
    session_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    # Check session exists and is not finalized
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session["status"] == "finalized":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify assignments for finalized session"
        )
    
    # Find active assignment
    assignment = await db.db.vehicle_assignments.find_one({
        "sessionId": session_id,
        "employeeId": employee_id,
        "unassignedAt": None
    })
    
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active assignment not found")
    
    # Unassign
    update_result = await db.db.vehicle_assignments.update_one(
        {"_id": assignment["_id"]},
        {
            "$set": {
                "unassignedAt": datetime.utcnow(),
                "unassignedBy": username
            }
        }
    )
    
    # Record audit event
    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "unassign_vehicle",
        "entityType": "vehicle_assignment",
        "entityId": str(assignment["_id"]),
        "previousValue": assignment,
        "newValue": {
            "unassignedAt": datetime.utcnow(),
            "unassignedBy": username
        },
        "createdAt": datetime.utcnow()
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return await db.db.vehicle_assignments.find_one({"_id": assignment["_id"]})

@router.get("/sessions/{session_id}/vehicles/{vehicle_id}", response_model=list[VehicleAssignment])
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

@router.get("/sessions/{session_id}/employees/{employee_id}", response_model=VehicleAssignment)
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active assignment found")
    return assignment
