from sqlalchemy import Column, Text, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Note(BaseModel):
    """Note model for case notes"""
    
    __tablename__ = "notes"

    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False, index=True)
    note_text = Column(Text, nullable=False)
    voice_note_url = Column(String(255), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    case = relationship("Case", back_populates="notes")
    user = relationship("User")
