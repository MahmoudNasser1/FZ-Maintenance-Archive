from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class WorkLog(BaseModel):
    """WorkLog model for tracking work time on cases"""
    
    __tablename__ = "work_logs"

    technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    total_duration = Column(Integer, nullable=True)  # Duration in seconds
    
    # Relationships
    case = relationship("Case", back_populates="work_logs")
    technician = relationship("User")
