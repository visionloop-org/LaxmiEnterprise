from fastapi import APIRouter, Depends, status
from typing import List, Optional
from app.models.employee import EmployeeResponse, EmployeeCreate, EmployeeUpdate, BulkCompensationItem
from app.db.mongodb import db
from core.auth import get_current_active_user
from datetime import datetime, timezone
from app.core.exceptions import NotFoundException, ConflictException

router = APIRouter()

@router.get("/", response_model=List[EmployeeResponse], operation_id="list_employees")
async def list_employees(
    category: Optional[str] = None,
    status: Optional[str] = None,
    username: str = Depends(get_current_active_user)
):
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status

    cursor = db.db.employees.find(query).sort("displayOrder", 1)
    return await cursor.to_list(length=200)

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, operation_id="create_employee")
async def create_employee(employee: EmployeeCreate, username: str = Depends(get_current_active_user)):
    existing = await db.db.employees.find_one({"employeeId": employee.employeeId})
    if existing:
        raise ConflictException(message=f"Employee with ID '{employee.employeeId}' already exists", code="DUPLICATE_EMPLOYEE_ID")

    employee_data = employee.dict()
    now = datetime.now(timezone.utc)
    employee_data["createdAt"] = now
    employee_data["updatedAt"] = now

    # Approval flow: If requested by supervisor, default to pending_approval unless specified
    if username != "admin" and not employee_data.get("status"):
        employee_data["status"] = "pending_approval"
        employee_data["requestedBy"] = username
    elif not employee_data.get("status"):
        employee_data["status"] = "active"

    result = await db.db.employees.insert_one(employee_data)
    created_employee = await db.db.employees.find_one({"_id": result.inserted_id})

    return created_employee

@router.put("/bulk/compensation", response_model=List[EmployeeResponse], operation_id="bulk_update_compensation")
async def bulk_update_compensation(
    items: List[BulkCompensationItem],
    username: str = Depends(get_current_active_user)
):
    now = datetime.now(timezone.utc)
    for item in items:
        update_fields = {"updatedAt": now}
        if item.baseRate is not None:
            update_fields["baseRate"] = float(item.baseRate)
        if item.extraHours is not None:
            update_fields["extraHours"] = float(item.extraHours)
        if item.incentive is not None:
            update_fields["incentive"] = float(item.incentive)

        await db.db.employees.update_one(
            {"employeeId": item.employeeId},
            {"$set": update_fields}
        )

    # Log bulk audit event
    audit_event = {
        "sessionId": "BULK-COMPENSATION",
        "actorId": username,
        "action": "bulk_update_compensation",
        "entityType": "employees",
        "entityId": f"{len(items)}_employees",
        "newValue": {"count": len(items), "updatedAt": now.isoformat()},
        "createdAt": now
    }
    await db.db.audit_events.insert_one(audit_event)

    cursor = db.db.employees.find({}).sort("displayOrder", 1)
    return await cursor.to_list(length=200)

@router.get("/{employee_id}", response_model=EmployeeResponse, operation_id="get_employee")
async def get_employee(employee_id: str, username: str = Depends(get_current_active_user)):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee with ID '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")
    return employee

@router.put("/{employee_id}", response_model=EmployeeResponse, operation_id="update_employee")
async def update_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    username: str = Depends(get_current_active_user)
):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee with ID '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")

    update_data = employee_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.now(timezone.utc)

    await db.db.employees.update_one(
        {"employeeId": employee_id},
        {"$set": update_data}
    )

    return await db.db.employees.find_one({"employeeId": employee_id})

@router.post("/{employee_id}/approve", response_model=EmployeeResponse, operation_id="approve_employee")
async def approve_employee(employee_id: str, username: str = Depends(get_current_active_user)):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee with ID '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")

    now = datetime.now(timezone.utc)
    await db.db.employees.update_one(
        {"employeeId": employee_id},
        {"$set": {"status": "active", "approvedBy": username, "updatedAt": now}}
    )
    return await db.db.employees.find_one({"employeeId": employee_id})

@router.post("/{employee_id}/reject", response_model=EmployeeResponse, operation_id="reject_employee")
async def reject_employee(employee_id: str, username: str = Depends(get_current_active_user)):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee with ID '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")

    now = datetime.now(timezone.utc)
    await db.db.employees.update_one(
        {"employeeId": employee_id},
        {"$set": {"status": "rejected", "approvedBy": username, "updatedAt": now}}
    )
    return await db.db.employees.find_one({"employeeId": employee_id})

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="delete_employee")
async def delete_employee(employee_id: str, username: str = Depends(get_current_active_user)):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise NotFoundException(message=f"Employee with ID '{employee_id}' not found", code="EMPLOYEE_NOT_FOUND")

    await db.db.employees.delete_one({"employeeId": employee_id})
    return None
