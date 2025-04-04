from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID

from app.core.database import get_db
from app.api.deps.auth import get_current_active_user, get_current_manager_or_admin_user
from app.models.user import User
from app.models.case import CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate, Case as CaseSchema, CaseList, CaseDetail
from app.services.activity_service import create_activity
from app.services.enhanced_notification_service import (
    send_status_change_notification,
    send_technician_assignment_notification,
    send_case_notification
)
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
    background_tasks: BackgroundTasks,
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
    
    # Send notification if technician is assigned
    if db_case.technician_id:
        background_tasks.add_task(
            send_technician_assignment_notification,
            db=db,
            case_id=db_case.id,
            technician_id=db_case.technician_id,
            assigned_by_id=current_user.id
        )
    
    # Notify managers about new case
    case_message = f"تم إنشاء حالة صيانة جديدة: {db_case.device_model or 'جهاز'} للعميل {db_case.client_name}"
    background_tasks.add_task(
        send_case_notification,
        db=db,
        case_id=db_case.id,
        message=case_message,
        notification_type="info",
        roles=["manager", "admin"],
        exclude_user_id=current_user.id
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


@router.put("/{case_id}", response_model=CaseSchema)
async def update_case(
    case_id: UUID,
    case_in: CaseUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update case.
    """
    db_case = case.get(db=db, case_id=case_id)
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="حالة الصيانة غير موجودة",
        )
    
    # Save old status and technician for notifications
    old_status = db_case.status
    old_technician_id = db_case.technician_id
    
    # Update the case
    updated_case = case.update(db=db, db_obj=db_case, obj_in=case_in)
    
    # Create activity log
    activity_description = "تم تحديث معلومات الحالة"
    # Add specific details about what changed
    changes = []
    
    if case_in.status is not None and old_status != updated_case.status:
        changes.append(f"تم تغيير الحالة من {old_status.value} إلى {updated_case.status.value}")
        # Send notification for status change
        background_tasks.add_task(
            send_status_change_notification,
            db=db,
            case_id=case_id,
            old_status=old_status,
            new_status=updated_case.status,
            changed_by_id=current_user.id
        )
    
    if case_in.technician_id is not None and old_technician_id != updated_case.technician_id:
        changes.append("تم تغيير الفني المسؤول")
        # Send notification for technician assignment
        if updated_case.technician_id:
            background_tasks.add_task(
                send_technician_assignment_notification,
                db=db,
                case_id=case_id,
                technician_id=updated_case.technician_id,
                assigned_by_id=current_user.id
            )
    
    if changes:
        activity_description += ": " + " | ".join(changes)
    
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=activity_description
    )
    
    return updated_case


@router.delete("/{case_id}", response_model=CaseSchema)
async def delete_case(
    case_id: UUID,
    background_tasks: BackgroundTasks,
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
    
    # Store case details for notification before deletion
    case_number = db_case.case_number or str(db_case.id)
    technician_id = db_case.technician_id
    
    # Delete the case
    deleted_case = case.delete(db=db, case_id=case_id)
    
    # Create activity for the deletion
    create_activity(
        db=db,
        case_id=None,  # Case has been deleted
        performed_by=current_user.id,
        action=f"تم حذف حالة الصيانة #{case_number}"
    )
    
    # Notify technician if assigned
    if technician_id:
        notification_message = f"تم حذف حالة الصيانة #{case_number} التي كانت معينة لك بواسطة {current_user.full_name}"
        background_tasks.add_task(
            send_notification,
            user_id=technician_id,
            message=notification_message,
            notification_type="warning",
            db=db
        )
    
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
    return case.get_multi(db=db, search=client_name)
