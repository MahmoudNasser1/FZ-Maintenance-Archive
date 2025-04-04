from sqlalchemy import Column, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Notification(BaseModel):
    """Notification model for user notifications"""
    
    __tablename__ = "notifications"

    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    related_case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=True)
    
    # Relationships
    recipient = relationship("User", backref="notifications")
    related_case = relationship("Case")
