from fastapi import APIRouter, Depends, HTTPException, status
from app.models.attendance import AttendanceRecord, AttendanceRecordCreate, AttendanceRecordUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.put("/sessions/{session_id}/employees/{employee_id}", response_model=AttendanceRecord)
async def record_attendance(
    session_id: str,
    employee_id: str,
    attendance: AttendanceRecordUpdate,
    username: str = Depends(get_current_active_user)
):
    # Validate session exists and is not finalized
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session["status"] == "finalized":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify attendance for finalized session"
        )
    
    # Validate employee exists
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    
    # Check if attendance record already exists
    existing_record = await db.db.attendance_records.find_one({
        "sessionId": session_id,
        "employeeId": employee_id
    })
    
    if existing_record:
        # Update existing record with version check
        current_version = existing_record["version"]
        
        update_data = attendance.dict(exclude_unset=True)
        update_data["version"] = current_version + 1
        update_data["recordedBy"] = username
        
        update_result = await db.db.attendance_records.update_one(
            {"_id": existing_record["_id"], "version": current_version},
            {"$set": update_data}
        )
        
        if update_result.modified_count == 0:
            # Version conflict
            updated_record = await db.db.attendance_records.find_one({"_id": existing_record["_id"]})
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "VERSION_CONFLICT",
                    "message": "Attendance record was modified by another user",
                    "currentVersion": updated_record["version"]
                }
            )
        
        # Record audit event
        audit_event = {
            "sessionId": session_id,
            "actorId": username,
            "action": "update_attendance",
            "entityType": "attendance_record",
            "entityId": str(existing_record["_id"]),
            "previousValue": {
                "status": existing_record["status"],
                "arrivalTime": existing_record.get("arrivalTime"),
                "version": current_version
            },
            "newValue": update_data,
            "createdAt": datetime.utcnow()
        }
        await db.db.audit_events.insert_one(audit_event)
        
        return await db.db.attendance_records.find_one({"_id": existing_record["_id"]})
    else:
        # Create new attendance record
        attendance_data = {
            "sessionId": session_id,
            "employeeId": employee_id,
            "status": attendance.status or "absent",
            "arrivalTime": attendance.arrivalTime,
            "recordedBy": username,
            "remarks": attendance.remarks,
            "version": 1,
            "recordedAt": datetime.utcnow()
        }
        
        result = await db.db.attendance_records.insert_one(attendance_data)
        created_record = await db.db.attendance_records.find_one({"_id": result.inserted_id})
        
        # Record audit event
        audit_event = {
            "sessionId": session_id,
            "actorId": username,
            "action": "create_attendance",
            "entityType": "attendance_record",
            "entityId": str(result.inserted_id),
            "newValue": attendance_data,
            "createdAt": datetime.utcnow()
        }
        await db.db.audit_events.insert_one(audit_event)
        
        return created_record

@router.get("/sessions/{session_id}", response_model=list[AttendanceRecord])
async def get_session_attendance(session_id: str, username: str = Depends(get_current_active_user)):
    # Validate session exists
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    cursor = db.db.attendance_records.find({"sessionId": session_id})
    return await cursor.to_list(length=200)

@router.get("/sessions/{session_id}/employees/{employee_id}", response_model=AttendanceRecord)
async def get_employee_attendance(
    session_id: str,
    employee_id: str,
    username: str = Depends(get_current_active_user)
):
    record = await db.db.attendance_records.find_one({
        "sessionId": session_id,
        "employeeId": employee_id
    })
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    return record
