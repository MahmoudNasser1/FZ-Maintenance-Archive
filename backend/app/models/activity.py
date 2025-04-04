from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Activity(BaseModel):
    """Activity model for logging actions performed on cases"""
    
    __tablename__ = "activities"

    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False, index=True)
    action = Column(Text, nullable=False)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    case = relationship("Case", back_populates="activities")
    user = relationship("User")
