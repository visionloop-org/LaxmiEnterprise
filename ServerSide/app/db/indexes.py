from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
import logging

logger = logging.getLogger(__name__)

async def create_indexes(db):
    """Create MongoDB indexes as specified in master instructions"""
    
    # Employees collection
    await db.employees.create_index([("employeeId", 1)], unique=True)
    await db.employees.create_index([("name", 1)])
    await db.employees.create_index([("category", 1)])
    logger.info("Created indexes for employees collection")
    
    # Vehicles collection
    await db.vehicles.create_index([("vehicleNumber", 1)], unique=True)
    logger.info("Created indexes for vehicles collection")
    
    # Attendance sessions collection
    await db.attendance_sessions.create_index([("sessionDate", 1), ("shift", 1)], unique=True)
    logger.info("Created indexes for attendance_sessions collection")
    
    # Attendance records collection
    await db.attendance_records.create_index([("sessionId", 1), ("employeeId", 1)], unique=True)
    logger.info("Created indexes for attendance_records collection")
    
    # Vehicle assignments collection
    await db.vehicle_assignments.create_index([("sessionId", 1), ("vehicleId", 1), ("unassignedAt", 1)])
    await db.vehicle_assignments.create_index([("sessionId", 1), ("employeeId", 1), ("unassignedAt", 1)])
    logger.info("Created indexes for vehicle_assignments collection")
    
    # Audit events collection
    await db.audit_events.create_index([("sessionId", 1), ("createdAt", 1)])
    logger.info("Created indexes for audit_events collection")
    
    logger.info("All MongoDB indexes created successfully")
