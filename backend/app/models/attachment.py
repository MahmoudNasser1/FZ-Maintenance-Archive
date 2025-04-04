from sqlalchemy import Column, String, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class AttachmentType(str, enum.Enum):
    IMAGE = "image"
    SCHEMATIC = "schematic"
    BOARD_VIEW = "board_view"
    FIRMWARE = "firmware"
    VIDEO = "video"
    DOCUMENT = "document"
    OTHER = "other"


class Attachment(BaseModel):
    """Attachment model for files related to cases"""
    
    __tablename__ = "attachments"

    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False, index=True)
    file_url = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(Enum(AttachmentType), nullable=False, index=True)
    file_size = Column(String(20), nullable=True)  # Size in bytes
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    case = relationship("Case", back_populates="attachments")
    user = relationship("User")
