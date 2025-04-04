from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID

from app.core.database import get_db
from app.api.deps.auth import get_current_active_user, get_current_manager_or_admin_user
from app.models.user import User
from app.models.case import CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate, Case as CaseSchema, CaseList, CaseDetail
from app.services.activity_service import create_activity
from app.crud.case import case

router = APIRouter()


@router.get("/", response_model=List[CaseList])
async def read_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CaseStatus] = None,
    technician_id: Optional[UUID] = None,
    search: Optional[str] = None,
    sort_field: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve cases with optional filtering, searching, and sorting.
    """
    cases = case.get_multi(
        db=db, 
        skip=skip, 
        limit=limit, 
        status=status,
        technician_id=technician_id,
        search=search,
        sort_field=sort_field,
        sort_order=sort_order
    )
    
    return cases


@router.get("/count", response_model=Dict[str, int])
async def get_case_counts(
    technician_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get counts of cases by status
    """
    return case.get_status_counts(db=db, technician_id=technician_id)


@router.post("/", response_model=CaseSchema)
async def create_new_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new case.
    """
    # Check if serial number already exists
    if case_in.serial_number:
        existing_case = case.get_by_serial_number(db, serial_number=case_in.serial_number)
        if existing_case:
            raise HTTPException(
                status_code=400,
                detail="A case with this serial number already exists",
            )
    
    # Create case
    db_case = case.create(db=db, obj_in=case_in)
    
    # Create activity log for case creation
    create_activity(
        db=db,
        case_id=db_case.id,
        performed_by=current_user.id,
        action=f"تم إنشاء حالة صيانة جديدة"
    )
    
    return db_case


@router.get("/{case_id}", response_model=CaseDetail)
async def read_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get case by ID.
    """
    db_case = case.get(db=db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    return db_case


@router.patch("/{case_id}", response_model=CaseSchema)
async def update_case(
    case_id: UUID,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update case.
    """
    db_case = case.get(db=db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    
    # Check if serial number already exists and belongs to a different case
    if case_in.serial_number and case_in.serial_number != db_case.serial_number:
        existing_case = case.get_by_serial_number(db, serial_number=case_in.serial_number)
        if existing_case and existing_case.id != case_id:
            raise HTTPException(
                status_code=400,
                detail="A case with this serial number already exists",
            )
    
    # Track changes for activity log
    changes = []
    update_data = case_in.dict(exclude_unset=True)
    
    # Check for status change
    if "status" in update_data and update_data["status"] != db_case.status:
        old_status = db_case.status.value
        new_status = update_data["status"].value
        changes.append(f"تغيير الحالة من {old_status} إلى {new_status}")
    
    # Check for technician change
    if "technician_id" in update_data and update_data["technician_id"] != db_case.technician_id:
        changes.append(f"تغيير الفني المسؤول")
    
    # Update case
    updated_case = case.update(db=db, db_obj=db_case, obj_in=case_in)
    
    # Create activity logs for changes
    if changes:
        for change in changes:
            create_activity(
                db=db,
                case_id=case_id,
                performed_by=current_user.id,
                action=change
            )
    else:
        create_activity(
            db=db,
            case_id=case_id,
            performed_by=current_user.id,
            action="تم تحديث بيانات الحالة"
        )
    
    return updated_case


@router.delete("/{case_id}", response_model=CaseSchema)
async def delete_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    Delete case. Only managers and admins can delete cases.
    """
    db_case = case.get(db=db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    
    deleted_case = case.delete(db=db, case_id=case_id)
    
    return deleted_case


@router.get("/serial/{serial_number}", response_model=CaseDetail)
async def read_case_by_serial(
    serial_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get case by serial number.
    """
    db_case = case.get_by_serial_number(db=db, serial_number=serial_number)
    if not db_case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    return db_case


@router.get("/client/{client_name}", response_model=List[CaseList])
async def read_cases_by_client(
    client_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get cases by client name (partial match).
    """
    search = client_name
    cases = case.get_multi(db=db, search=search)
    return cases
