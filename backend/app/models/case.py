from sqlalchemy import Column, String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class CaseStatus(str, enum.Enum):
    IN_PROGRESS = "قيد الإصلاح"
    FIXED = "تم الإصلاح"
    WAITING_PARTS = "بانتظار القطعة"
    DELIVERED = "تم التسليم"
    CANCELLED = "ملغى"


class Case(BaseModel):
    """Case model for maintenance cases"""
    
    __tablename__ = "cases"

    device_model = Column(String(100), nullable=False, index=True)
    serial_number = Column(String(100), unique=True, index=True)
    client_name = Column(String(100), nullable=False, index=True)
    client_phone = Column(String(20), nullable=True)
    issue_description = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    status = Column(
        Enum(CaseStatus), 
        nullable=False, 
        default=CaseStatus.IN_PROGRESS,
        index=True
    )
    technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationships
    technician = relationship("User", backref="cases")
    attachments = relationship("Attachment", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="case", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="case", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="case", cascade="all, delete-orphan")
