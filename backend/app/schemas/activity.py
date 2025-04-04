from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

from app.schemas.user import UserMinimal


# Shared properties
class ActivityBase(BaseModel):
    action: str


# Properties to receive via API on creation
class ActivityCreate(ActivityBase):
    case_id: UUID4


# Properties to return via API
class Activity(ActivityBase):
    id: UUID4
    case_id: UUID4
    performed_by: UUID4
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API with related user
class ActivityWithUser(Activity):
    user: Optional[UserMinimal] = None

    class Config:
        orm_mode = True
        from_attributes = True
