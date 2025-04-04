from sqlalchemy import Column, String, Text, ForeignKey, Enum, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class CaseStatus(str, enum.Enum):
    new = "جديد"
    assigned = "معيّن"
    in_progress = "قيد الإصلاح"
    waiting_parts = "بانتظار القطعة"
    resolved = "تم الإصلاح"
    delivered = "تم التسليم"
    cancelled = "ملغى"


class CasePriority(str, enum.Enum):
    low = "منخفضة"
    medium = "متوسطة"
    high = "عالية"
    urgent = "عاجلة"


class Case(BaseModel):
    """Case model for maintenance cases"""
    
    __tablename__ = "cases"

    case_number = Column(String(50), nullable=True, index=True)
    device_model = Column(String(100), nullable=False, index=True)
    device_type = Column(String(100), nullable=True)
    serial_number = Column(String(100), unique=True, index=True)
    client_name = Column(String(100), nullable=False, index=True)
    client_phone = Column(String(20), nullable=True)
    client_email = Column(String(100), nullable=True)
    issue_description = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    status = Column(
        Enum(CaseStatus), 
        nullable=False, 
        default=CaseStatus.new,
        index=True
    )
    priority = Column(
        Enum(CasePriority),
        nullable=True,
        default=CasePriority.medium,
        index=True
    )
    technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    cost = Column(Float, nullable=True)
    customer_satisfaction = Column(Integer, nullable=True)  # تقييم من 1 إلى 5
    
    # Relationships
    technician = relationship("User", backref="cases")
    attachments = relationship("Attachment", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="case", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="case", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="case", cascade="all, delete-orphan")
