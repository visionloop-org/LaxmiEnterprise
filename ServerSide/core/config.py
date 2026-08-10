import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DEBUG: bool = False
    DATABASE_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "laxmi_enterprise"
    JWT_SECRET: str = "your-super-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
