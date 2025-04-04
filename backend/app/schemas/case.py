from typing import Optional, List
from pydantic import BaseModel, UUID4, Field
from datetime import datetime

from app.models.case import CaseStatus
from app.schemas.user import UserMinimal


# Shared properties
class CaseBase(BaseModel):
    device_model: str
    serial_number: str
    client_name: str
    client_phone: Optional[str] = None
    issue_description: str
    diagnosis: Optional[str] = None
    solution: Optional[str] = None
    status: CaseStatus = CaseStatus.IN_PROGRESS


# Properties to receive via API on creation
class CaseCreate(CaseBase):
    technician_id: UUID4


# Properties to receive via API on update
class CaseUpdate(BaseModel):
    device_model: Optional[str] = None
    serial_number: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    issue_description: Optional[str] = None
    diagnosis: Optional[str] = None
    solution: Optional[str] = None
    status: Optional[CaseStatus] = None
    technician_id: Optional[UUID4] = None


# Properties to return via API
class Case(CaseBase):
    id: UUID4
    technician_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API for list
class CaseList(Case):
    technician: Optional[UserMinimal] = None

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return via API for detail
class CaseDetail(CaseList):
    pass  # Will extend this with relationships (attachments, notes, etc.)
