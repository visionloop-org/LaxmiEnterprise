import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DEBUG: bool = False
    DATABASE_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "laxmi_enterprise"
    MONGODB_URI: Optional[str] = None  # Add support for MONGODB_URI environment variable
    JWT_SECRET: str = "your-super-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def EFFECTIVE_DATABASE_URL(self) -> str:
        """Use MONGODB_URI if available, otherwise fall back to DATABASE_URL"""
        return self.MONGODB_URI or self.DATABASE_URL

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
