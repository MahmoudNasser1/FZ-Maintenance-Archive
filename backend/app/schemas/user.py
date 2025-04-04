from typing import Optional
from pydantic import BaseModel, EmailStr, Field, UUID4
from datetime import datetime

from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    is_active: bool = True
    role: UserRole = UserRole.TECHNICIAN
    profile_image: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties to receive via API on update
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    profile_image: Optional[str] = None
    points: Optional[int] = None


# Properties to return via API
class User(UserBase):
    id: UUID4
    points: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API with minimal info
class UserMinimal(BaseModel):
    id: UUID4
    username: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True
