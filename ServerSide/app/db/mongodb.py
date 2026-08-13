from motor.motor_asyncio import AsyncIOMotorClient
try:
    from mongomock_motor import AsyncMongoMockClient
except ImportError:
    AsyncMongoMockClient = None
from core.config import settings
import logging
from datetime import datetime, timezone
from app.db.indexes import create_indexes


logger = logging.getLogger(__name__)

async def seed_fallback_data(db_instance):
    """Seed initial demo data into fallback in-memory database."""
    try:
        # Check if already seeded
        existing_emp = await db_instance.employees.find_one({})
        if existing_emp:
            return

        employees = [
            {"employeeId": "EMP001", "name": "John Doe", "category": "Drivers", "phone": "9876543210", "status": "active", "displayOrder": 1},
            {"employeeId": "EMP002", "name": "Jane Smith", "category": "Workers", "phone": "9876543211", "status": "active", "displayOrder": 2},
            {"employeeId": "EMP003", "name": "Bob Wilson", "category": "Chalan Men", "phone": "9876543212", "status": "active", "displayOrder": 3},
            {"employeeId": "EMP004", "name": "Alice Johnson", "category": "Workers", "phone": "9876543213", "status": "active", "displayOrder": 4},
            {"employeeId": "EMP005", "name": "Charlie Brown", "category": "Office", "phone": "9876543214", "status": "active", "displayOrder": 5},
        ]
        await db_instance.employees.insert_many(employees)

        vehicles = [
            {"vehicleNumber": "VEH-101", "vehicleType": "Truck", "name": "Bus A", "capacity": 30, "status": "Available", "active": True},
            {"vehicleNumber": "VEH-102", "vehicleType": "Tipper", "name": "Van B", "capacity": 10, "status": "Maintenance", "active": True},
            {"vehicleNumber": "VEH-103", "vehicleType": "JCB", "name": "JCB 1", "capacity": 5, "status": "Available", "active": True},
        ]
        await db_instance.vehicles.insert_many(vehicles)

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        active_session = {
            "_id": f"SES-{today_str}-Morning",
            "sessionId": f"SES-{today_str}-Morning",
            "sessionDate": today_str,
            "shift": "Morning",
            "supervisorId": "admin",
            "status": "in_progress",
            "version": 1,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db_instance.attendance_sessions.insert_one(active_session)
        logger.info("Successfully seeded in-memory fallback database.")
    except Exception as e:
        logger.warning(f"Failed to seed fallback data: {e}")

class Database:
    client = None
    db = None
    is_connected: bool = False

    @classmethod
    async def connect(cls):
        try:
            database_url = settings.EFFECTIVE_DATABASE_URL
            cls.client = AsyncIOMotorClient(
                database_url,
                serverSelectionTimeoutMS=2000
            )
            cls.db = cls.client[settings.MONGODB_DATABASE]
            await cls.client.admin.command('ping')
            cls.is_connected = True
            logger.info(f"Connected to live MongoDB at {database_url}")
            await create_indexes(cls.db)
        except Exception as e:
            logger.warning(f"Live MongoDB connection unavailable ({e}). Initializing in-memory Mongo database...")
            cls.client = AsyncMongoMockClient()
            cls.db = cls.client[settings.MONGODB_DATABASE]
            cls.is_connected = True
            await seed_fallback_data(cls.db)

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            cls.is_connected = False
            logger.info("Database connection closed")

db = Database()
