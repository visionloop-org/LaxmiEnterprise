from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: str  # e.g., "admin", "supervisor"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
