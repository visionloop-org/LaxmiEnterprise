import pytest
import asyncio
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from app.db.mongodb import db
from core.auth import create_access_token
from datetime import datetime, timezone

@pytest.fixture(autouse=True)
def setup_mock_db():
    mock_client = AsyncMongoMockClient()
    mock_database = mock_client["test_laxmi_db"]
    
    original_db = db.db
    original_is_connected = db.is_connected
    
    db.db = mock_database
    db.is_connected = True
    
    yield mock_database
    
    db.db = original_db
    db.is_connected = original_is_connected

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_token():
    return create_access_token({"sub": "admin", "role": "admin"})

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture
def seed_data(setup_mock_db):
    mock_db = setup_mock_db
    
    async def _seed():
        await mock_db.employees.delete_many({})
        await mock_db.vehicles.delete_many({})
        await mock_db.attendance_sessions.delete_many({})
        await mock_db.attendance_records.delete_many({})
        await mock_db.vehicle_assignments.delete_many({})
        await mock_db.audit_events.delete_many({})
        
        employees = [
            {"employeeId": "EMP001", "name": "John Doe", "category": "Driver", "phone": "9876543210", "active": True},
            {"employeeId": "EMP002", "name": "Jane Smith", "category": "Worker", "phone": "9876543211", "active": True},
            {"employeeId": "EMP003", "name": "Bob Wilson", "category": "Supervisor", "phone": "9876543212", "active": True},
        ]
        await mock_db.employees.insert_many(employees)
        
        vehicles = [
            {
                "vehicleNumber": "VEH-101",
                "vehicleType": "Truck",
                "name": "Bus A",
                "capacity": 30,
                "status": "Available",
                "active": True
            },
            {
                "vehicleNumber": "VEH-102",
                "vehicleType": "Tipper",
                "name": "Van B",
                "capacity": 10,
                "status": "Maintenance",
                "active": True
            }
        ]
        await mock_db.vehicles.insert_many(vehicles)
        
        active_session = {
            "_id": "SES-2026-08-11",
            "sessionId": "SES-2026-08-11",
            "sessionDate": "2026-08-11",
            "shift": "Morning",
            "supervisorId": "admin",
            "status": "in_progress",
            "version": 1,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await mock_db.attendance_sessions.insert_one(active_session)

        finalized_session = {
            "_id": "SES-2026-08-10",
            "sessionId": "SES-2026-08-10",
            "sessionDate": "2026-08-10",
            "shift": "Morning",
            "supervisorId": "admin",
            "status": "finalized",
            "version": 1,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await mock_db.attendance_sessions.insert_one(finalized_session)

        return {
            "employees": employees,
            "vehicles": vehicles,
            "active_session": active_session,
            "finalized_session": finalized_session
        }

    return asyncio.run(_seed())
