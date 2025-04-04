from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

from app.models.attachment import AttachmentType
from app.schemas.user import UserMinimal


# Shared properties
class AttachmentBase(BaseModel):
    file_name: str
    file_type: AttachmentType
    file_size: Optional[str] = None


# Properties to receive via API on creation
class AttachmentCreate(AttachmentBase):
    case_id: UUID4
    file_url: str


# Properties to receive via API on update
class AttachmentUpdate(BaseModel):
    file_name: Optional[str] = None
    file_type: Optional[AttachmentType] = None


# Properties to return via API
class Attachment(AttachmentBase):
    id: UUID4
    case_id: UUID4
    file_url: str
    uploaded_by: UUID4
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API with related user
class AttachmentWithUser(Attachment):
    user: Optional[UserMinimal] = None

    class Config:
        orm_mode = True
        from_attributes = True
