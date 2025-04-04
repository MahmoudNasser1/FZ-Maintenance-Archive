from sqlalchemy import Boolean, Column, String, Text, Integer, ForeignKey, Enum
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    MANAGER = "manager"


class User(BaseModel):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"

    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TECHNICIAN)
    points = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    profile_image = Column(String(255), nullable=True)
