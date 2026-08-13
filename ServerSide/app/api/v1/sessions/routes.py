from fastapi import APIRouter, Depends, status
from typing import List, Optional
from datetime import datetime, timezone
from app.models.session import AttendanceSessionResponse, AttendanceSessionCreate, AttendanceSessionUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException

router = APIRouter()


@router.post("/", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED, operation_id="create_session")
async def create_session(session: AttendanceSessionCreate, username: str = Depends(get_current_active_user)):
    existing = await db.db.attendance_sessions.find_one({
        "$or": [
            {"sessionDate": session.sessionDate, "shift": session.shift},
            {"_id": session.sessionId} if hasattr(session, "sessionId") and session.sessionId else {"sessionDate": session.sessionDate, "shift": session.shift}
        ]
    })
    if existing:
        raise ConflictException(
            message=f"Session already exists for date '{session.sessionDate}' and shift '{session.shift}'",
            code="SESSION_ALREADY_EXISTS"
        )

    session_data = session.dict()
    now = datetime.now(timezone.utc)
    session_data["createdAt"] = now
    session_data["updatedAt"] = now
    if "_id" not in session_data or not session_data["_id"]:
        session_data["_id"] = session.sessionId if hasattr(session, "sessionId") and session.sessionId else f"SES-{session.sessionDate}-{session.shift}"

    result = await db.db.attendance_sessions.insert_one(session_data)
    created_session = await db.db.attendance_sessions.find_one({"_id": session_data["_id"]})

    audit_event = {
        "sessionId": str(session_data["_id"]),
        "actorId": username,
        "action": "create_session",
        "entityType": "attendance_session",
        "entityId": str(session_data["_id"]),
        "newValue": session_data,
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)

    return created_session

@router.get("/", response_model=List[AttendanceSessionResponse], operation_id="list_sessions")
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

@router.get("/{session_id}", response_model=AttendanceSessionResponse, operation_id="get_session")
async def get_session(session_id: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")
    return session

@router.get("/active/by-date/{session_date}/{shift}", response_model=AttendanceSessionResponse, operation_id="get_active_session")
async def get_active_session(session_date: str, shift: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({
        "sessionDate": session_date,
        "shift": shift
    })
    if not session:
        now = datetime.now(timezone.utc)
        session_id = f"SES-{session_date}-{shift}"
        new_session = {
            "_id": session_id,
            "sessionId": session_id,
            "sessionDate": session_date,
            "shift": shift,
            "supervisorId": username,
            "status": "in_progress",
            "version": 1,
            "createdAt": now,
            "updatedAt": now
        }
        await db.db.attendance_sessions.insert_one(new_session)
        return await db.db.attendance_sessions.find_one({"_id": session_id})
    return session


@router.post("/{session_id}/finalize", response_model=AttendanceSessionResponse, operation_id="finalize_session")
async def finalize_session(session_id: str, username: str = Depends(get_current_active_user)):
    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")

    if session.get("status") == "finalized":
        return session

    current_version = session.get("version", 1)
    now = datetime.now(timezone.utc)

    update_result = await db.db.attendance_sessions.update_one(
        {"_id": session["_id"], "version": current_version},
        {
            "$set": {
                "status": "finalized",
                "finalizedAt": now,
                "finalizedBy": username,
                "version": current_version + 1,
                "updatedAt": now
            }
        }
    )

    if update_result.modified_count == 0:
        updated_session = await db.db.attendance_sessions.find_one({"_id": session["_id"]})
        raise ConflictException(
            message="Session was modified by another user",
            code="VERSION_CONFLICT",
            details={
                "currentVersion": updated_session.get("version"),
                "currentStatus": updated_session.get("status")
            }
        )

    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "finalize_session",
        "entityType": "attendance_session",
        "entityId": str(session["_id"]),
        "previousValue": {"status": session.get("status"), "version": current_version},
        "newValue": {"status": "finalized", "version": current_version + 1},
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)

    return await db.db.attendance_sessions.find_one({"_id": session["_id"]})

@router.post("/{session_id}/unlock", response_model=AttendanceSessionResponse, operation_id="unlock_session")
async def unlock_session(session_id: str, username: str = Depends(get_current_active_user)):
    if username != "admin":
        raise ForbiddenException(
            message="Only Admin users have rights to reset/unlock a finalized attendance session",
            code="ADMIN_ONLY_UNLOCK"
        )

    session = await db.db.attendance_sessions.find_one({"$or": [{"_id": session_id}, {"sessionId": session_id}]})
    if not session:
        raise NotFoundException(message=f"Session '{session_id}' not found", code="SESSION_NOT_FOUND")

    current_version = session.get("version", 1)
    now = datetime.now(timezone.utc)

    await db.db.attendance_sessions.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "status": "in_progress",
                "unlockedAt": now,
                "unlockedBy": username,
                "version": current_version + 1,
                "updatedAt": now
            }
        }
    )

    audit_event = {
        "sessionId": session_id,
        "actorId": username,
        "action": "unlock_session",
        "entityType": "attendance_session",
        "entityId": str(session["_id"]),
        "previousValue": {"status": session.get("status")},
        "newValue": {"status": "in_progress"},
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)

    return await db.db.attendance_sessions.find_one({"_id": session["_id"]})

