from fastapi import APIRouter, Depends, status
from typing import List
from datetime import datetime, timezone
from app.models.attendance import AttendanceRecordResponse, AttendanceRecordCreate, AttendanceRecordUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from app.core.exceptions import NotFoundException, ConflictException, ValidationException

router = APIRouter()

@router.put("/sessions/{session_id}/employees/{employee_id}", response_model=AttendanceRecordResponse, operation_id="record_attendance")
async def record_attendance(
    session_id: str,
    employee_id: str,
    attendance: AttendanceRecordUpdate,
    username: str = Depends(get_current_active_user)
):
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")

    if session.get("status") == "finalized":
        raise ValidationException(
            message="Cannot modify attendance for finalized session",
            code="SESSION_FINALIZED_LOCKED"
        )

    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")

    existing_record = await db.db.attendance_records.find_one({
        "sessionId": session_id,
        "employeeId": employee_id
    })

    now = datetime.now(timezone.utc)

    if existing_record:
        current_version = existing_record.get("version", 1)

        update_data = attendance.dict(exclude_unset=True)
        update_data["version"] = current_version + 1
        update_data["recordedBy"] = username

        update_result = await db.db.attendance_records.update_one(
            {"_id": existing_record["_id"], "version": current_version},
            {"$set": update_data}
        )

        if update_result.modified_count == 0:
            updated_record = await db.db.attendance_records.find_one({"_id": existing_record["_id"]})
            raise ConflictException(
                message="Attendance record was modified by another user",
                code="VERSION_CONFLICT",
                details={
                    "currentVersion": updated_record.get("version")
                }
            )

        audit_event = {
            "sessionId": session_id,
            "actorId": username,
            "action": "update_attendance",
            "entityType": "attendance_record",
            "entityId": str(existing_record["_id"]),
            "previousValue": {
                "status": existing_record.get("status"),
                "arrivalTime": existing_record.get("arrivalTime"),
                "version": current_version
            },
            "newValue": update_data,
            "createdAt": now
        }
        await db.db.audit_events.insert_one(audit_event)

        return await db.db.attendance_records.find_one({"_id": existing_record["_id"]})
    else:
        attendance_data = {
            "sessionId": session_id,
            "employeeId": employee_id,
            "status": attendance.status or "absent",
            "arrivalTime": attendance.arrivalTime,
            "recordedBy": username,
            "remarks": attendance.remarks,
            "version": 1,
            "recordedAt": now
        }

        result = await db.db.attendance_records.insert_one(attendance_data)
        created_record = await db.db.attendance_records.find_one({"_id": result.inserted_id})

        audit_event = {
            "sessionId": session_id,
            "actorId": username,
            "action": "create_attendance",
            "entityType": "attendance_record",
            "entityId": str(result.inserted_id),
            "newValue": attendance_data,
            "createdAt": now
        }
        await db.db.audit_events.insert_one(audit_event)

        return created_record

@router.get("/sessions/{session_id}", response_model=List[AttendanceRecordResponse], operation_id="get_session_attendance")
async def get_session_attendance(session_id: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")

    cursor = db.db.attendance_records.find({"sessionId": session_id})
    return await cursor.to_list(length=200)

@router.get("/sessions/{session_id}/employees/{employee_id}", response_model=AttendanceRecordResponse, operation_id="get_employee_attendance")
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
        raise NotFoundException(message=f"Attendance record for employee '{employee_id}' in session '{session_id}' not found", code="ATTENDANCE_RECORD_NOT_FOUND")
    return record
