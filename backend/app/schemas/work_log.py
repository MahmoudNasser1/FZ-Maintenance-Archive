from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

from app.schemas.user import UserMinimal
from app.schemas.case import Case


# Shared properties
class WorkLogBase(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    total_duration: Optional[int] = None  # In seconds


# Properties to receive via API on creation
class WorkLogCreate(WorkLogBase):
    case_id: UUID4
    technician_id: UUID4


# Properties to receive via API on update
class WorkLogUpdate(BaseModel):
    end_time: Optional[datetime] = None
    total_duration: Optional[int] = None


# Properties to return via API
class WorkLog(WorkLogBase):
    id: UUID4
    case_id: UUID4
    technician_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API with related entities
class WorkLogDetail(WorkLog):
    technician: Optional[UserMinimal] = None

    class Config:
        orm_mode = True
        from_attributes = True
