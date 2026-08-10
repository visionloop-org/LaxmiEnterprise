from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
import logging
from app.db.indexes import create_indexes

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        try:
            database_url = settings.EFFECTIVE_DATABASE_URL
            cls.client = AsyncIOMotorClient(database_url)
            cls.db = cls.client[settings.MONGODB_DATABASE]
            logger.info(f"Connected to MongoDB at {database_url}")
            
            # Create indexes
            await create_indexes(cls.db)
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

db = Database()
