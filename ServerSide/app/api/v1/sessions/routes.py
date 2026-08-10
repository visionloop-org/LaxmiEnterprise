from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models.session import AttendanceSession, AttendanceSessionCreate, AttendanceSessionUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=AttendanceSession)
async def create_session(session: AttendanceSessionCreate, username: str = Depends(get_current_active_user)):
    # Check if session already exists for this date and shift
    existing = await db.db.attendance_sessions.find_one({
        "sessionDate": session.sessionDate,
        "shift": session.shift
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already exists for this date and shift"
        )
    
    session_data = session.dict()
    session_data["createdAt"] = datetime.utcnow()
    session_data["updatedAt"] = datetime.utcnow()
    
    result = await db.db.attendance_sessions.insert_one(session_data)
    created_session = await db.db.attendance_sessions.find_one({"_id": result.inserted_id})
    
    # Record audit event
    audit_event = {
        "sessionId": str(result.inserted_id),
        "actorId": username,
        "action": "create_session",
        "entityType": "attendance_session",
        "entityId": str(result.inserted_id),
        "newValue": session_data,
        "createdAt": datetime.utcnow()
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return created_session

@router.get("/", response_model=List[AttendanceSession])
async def list_sessions(
    session_date: Optional[str] = None,
    shift: Optional[str] = None,
    status: Optional[str] = None,
    username: str = Depends(get_current_active_user)
):
    query = {}
    if session_date:
        query["sessionDate"] = session_date
    if shift:
        query["shift"] = shift
    if status:
        query["status"] = status
    
    cursor = db.db.attendance_sessions.find(query).sort("sessionDate", -1)
    return await cursor.to_list(length=100)

@router.get("/{session_id}", response_model=AttendanceSession)
async def get_session(session_id: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session

@router.get("/active/by-date/{session_date}/{shift}", response_model=AttendanceSession)
async def get_active_session(session_date: str, shift: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({
        "sessionDate": session_date,
        "shift": shift,
        "status": "in_progress"
    })
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active session found")
    return session

@router.post("/{session_id}/finalize", response_model=AttendanceSession)
async def finalize_session(session_id: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session["status"] == "finalized":
        return session  # Idempotent
    
    # Optimistic concurrency check
    current_version = session["version"]
    
    # Update session with version increment
    update_result = await db.db.attendance_sessions.update_one(
        {"_id": session_id, "version": current_version},
        {
            "$set": {
                "status": "finalized",
                "finalizedAt": datetime.utcnow(),
                "finalizedBy": username,
                "version": current_version + 1,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    if update_result.modified_count == 0:
        # Version conflict - session was modified by another client
        updated_session = await db.db.attendance_sessions.find_one({"_id": session_id})
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "VERSION_CONFLICT",
                "message": "Session was modified by another user",
                "currentVersion": updated_session["version"],
                "currentStatus": updated_session["status"]
            }
        )
    
    # Record audit event
    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "finalize_session",
        "entityType": "attendance_session",
        "entityId": session_id,
        "previousValue": {"status": session["status"], "version": current_version},
        "newValue": {"status": "finalized", "version": current_version + 1},
        "createdAt": datetime.utcnow()
    }
    await db.db.audit_events.insert_one(audit_event)
    
    return await db.db.attendance_sessions.find_one({"_id": session_id})

