from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional, Dict
from pydantic import BaseModel
from app.db.mongodb import db
from core.auth import get_current_active_user

router = APIRouter()

DEFAULT_RATES: Dict[str, float] = {
    "Drivers": 800.0,
    "Chalan Men": 650.0,
    "Workers": 500.0,
    "Office": 750.0,
    "Extra Labour": 450.0
}

class PayCalculationRequest(BaseModel):
    category: str
    status: str  # on_time, arrived, absent
    hoursWorked: float = 8.0
    extraHours: float = 0.0

class PayCalculationResponse(BaseModel):
    category: str
    status: str
    baseRate: float
    hourlyRate: float
    hoursWorked: float
    extraHours: float
    basePay: float
    extraDutyPay: float
    totalPay: float

@router.get("/rates", operation_id="get_pay_rates")
async def get_pay_rates(username: str = Depends(get_current_active_user)):
    return DEFAULT_RATES

@router.post("/calculate", response_model=PayCalculationResponse, operation_id="calculate_pay")
async def calculate_pay(req: PayCalculationRequest, username: str = Depends(get_current_active_user)):
    base_rate = DEFAULT_RATES.get(req.category, 500.0)
    hourly_rate = base_rate / 8.0

    if req.status in ["on_time", "arrived"]:
        base_pay = base_rate
    else:
        base_pay = 0.0

    extra_duty_pay = max(0.0, req.extraHours) * (hourly_rate * 1.5)
    total_pay = base_pay + extra_duty_pay

    return PayCalculationResponse(
        category=req.category,
        status=req.status,
        baseRate=base_rate,
        hourlyRate=hourly_rate,
        hoursWorked=req.hoursWorked,
        extraHours=req.extraHours,
        basePay=round(base_pay, 2),
        extraDutyPay=round(extra_duty_pay, 2),
        totalPay=round(total_pay, 2)
    )

@router.get("/summary", operation_id="get_pay_summary")
async def get_pay_summary(
    session_date: Optional[str] = Query(None),
    username: str = Depends(get_current_active_user)
):
    query = {}
    if session_date:
        query["sessionDate"] = session_date

    records = await db.db.attendance_records.find(query).to_list(length=1000)

    total_base_pay = 0.0
    total_extra_duty_pay = 0.0
    total_pay = 0.0
    present_count = 0

    for rec in records:
        if rec.get("status") in ["on_time", "arrived"]:
            present_count += 1
            cat = rec.get("category", "Workers")
            base_rate = DEFAULT_RATES.get(cat, 500.0)
            extra_h = float(rec.get("extraHours", 0.0))
            bp = float(rec.get("basePay", base_rate))
            ep = float(rec.get("extraDutyPay", extra_h * (base_rate / 8.0) * 1.5))
            tp = float(rec.get("totalPay", bp + ep))

            total_base_pay += bp
            total_extra_duty_pay += ep
            total_pay += tp

    return {
        "sessionDate": session_date or "All Dates",
        "totalEmployeesPresent": present_count,
        "totalBasePay": round(total_base_pay, 2),
        "totalExtraDutyPay": round(total_extra_duty_pay, 2),
        "grandTotalPay": round(total_pay, 2)
    }
