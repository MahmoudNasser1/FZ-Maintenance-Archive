from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime


# Shared properties
class NotificationBase(BaseModel):
    message: str
    is_read: bool = False
    related_case_id: Optional[UUID4] = None


# Properties to receive via API on creation
class NotificationCreate(NotificationBase):
    recipient_id: UUID4


# Properties to receive via API on update
class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


# Properties to return via API
class Notification(NotificationBase):
    id: UUID4
    recipient_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
