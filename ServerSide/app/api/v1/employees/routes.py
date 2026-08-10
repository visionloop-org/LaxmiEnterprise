from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.employee import Employee, EmployeeCreate, EmployeeUpdate
from app.db.mongodb import db
from core.auth import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Employee])
async def list_employees(
    category: str = None,
    status: str = None,
    username: str = Depends(get_current_active_user)
):
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    
    cursor = db.db.employees.find(query).sort("displayOrder", 1)
    return await cursor.to_list(length=200)

@router.post("/", response_model=Employee)
async def create_employee(employee: EmployeeCreate, username: str = Depends(get_current_active_user)):
    # Check if employeeId already exists
    existing = await db.db.employees.find_one({"employeeId": employee.employeeId})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee with this ID already exists"
        )
    
    employee_data = employee.dict()
    employee_data["createdAt"] = datetime.utcnow()
    employee_data["updatedAt"] = datetime.utcnow()
    
    result = await db.db.employees.insert_one(employee_data)
    created_employee = await db.db.employees.find_one({"_id": result.inserted_id})
    
    return created_employee

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, username: str = Depends(get_current_active_user)):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee

@router.put("/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    username: str = Depends(get_current_active_user)
):
    employee = await db.db.employees.find_one({"employeeId": employee_id})
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    
    update_data = employee_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.db.employees.update_one(
        {"employeeId": employee_id},
        {"$set": update_data}
    )
    
    return await db.db.employees.find_one({"employeeId": employee_id})
