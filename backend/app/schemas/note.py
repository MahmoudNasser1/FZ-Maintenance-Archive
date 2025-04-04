from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

from app.schemas.user import UserMinimal


# Shared properties
class NoteBase(BaseModel):
    note_text: str
    voice_note_url: Optional[str] = None


# Properties to receive via API on creation
class NoteCreate(NoteBase):
    case_id: UUID4


# Properties to receive via API on update
class NoteUpdate(BaseModel):
    note_text: Optional[str] = None
    voice_note_url: Optional[str] = None


# Properties to return via API
class Note(NoteBase):
    id: UUID4
    case_id: UUID4
    created_by: UUID4
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API with related user
class NoteWithUser(Note):
    user: Optional[UserMinimal] = None

    class Config:
        orm_mode = True
        from_attributes = True
