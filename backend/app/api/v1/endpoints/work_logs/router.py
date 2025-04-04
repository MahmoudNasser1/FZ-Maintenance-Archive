from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.crud.work_log import work_log
from app.schemas.work_log import WorkLogCreate, WorkLogUpdate, WorkLog as WorkLogSchema, WorkLogDetail
from app.services.activity_service import create_activity

router = APIRouter()


@router.get("/", response_model=List[WorkLogDetail])
async def read_work_logs(
    case_id: Optional[UUID] = None,
    technician_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve work logs with optional filtering.
    """
    return work_log.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        case_id=case_id,
        technician_id=technician_id,
        start_date=start_date,
        end_date=end_date
    )


@router.post("/", response_model=WorkLogSchema, status_code=status.HTTP_201_CREATED)
async def create_work_log(
    work_log_in: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new work log entry.
    """
    # Check if technician has an active work log
    active_log = work_log.get_active_work_log(
        db=db,
        technician_id=work_log_in.technician_id
    )
    
    if active_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="هناك جلسة عمل نشطة بالفعل لهذا الفني. يرجى إنهاؤها قبل بدء جلسة جديدة."
        )
    
    # Create the work log
    db_work_log = work_log.create(
        db=db,
        obj_in=work_log_in
    )
    
    # Log activity
    create_activity(
        db=db,
        case_id=work_log_in.case_id,
        performed_by=current_user.id,
        action=f"بدأ العمل على الحالة"
    )
    
    return db_work_log


@router.get("/{work_log_id}", response_model=WorkLogDetail)
async def read_work_log(
    work_log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get work log by ID.
    """
    db_work_log = work_log.get(db=db, work_log_id=work_log_id)
    if not db_work_log:
        raise HTTPException(status_code=404, detail="سجل العمل غير موجود")
    return db_work_log


@router.put("/{work_log_id}", response_model=WorkLogSchema)
async def update_work_log(
    work_log_id: UUID,
    work_log_in: WorkLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update work log. Primarily used to end a work session.
    """
    db_work_log = work_log.get(db=db, work_log_id=work_log_id)
    if not db_work_log:
        raise HTTPException(status_code=404, detail="سجل العمل غير موجود")
    
    # Check permissions (only the technician or admin can update)
    if db_work_log.technician_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية لتعديل سجل العمل هذا"
        )
    
    # Updating a work log that already has an end time
    if db_work_log.end_time and work_log_in.end_time:
        # Check if we're just updating the existing end time
        if work_log_in.end_time != db_work_log.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لا يمكن تعديل وقت انتهاء جلسة العمل المغلقة بالفعل"
            )
    
    db_work_log = work_log.update(
        db=db,
        db_obj=db_work_log,
        obj_in=work_log_in
    )
    
    # Log activity if we're ending a work session
    if work_log_in.end_time and not db_work_log.end_time:
        create_activity(
            db=db,
            case_id=db_work_log.case_id,
            performed_by=current_user.id,
            action=f"أنهى العمل على الحالة"
        )
    
    return db_work_log


@router.delete("/{work_log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_log(
    work_log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete work log.
    """
    db_work_log = work_log.get(db=db, work_log_id=work_log_id)
    if not db_work_log:
        raise HTTPException(status_code=404, detail="سجل العمل غير موجود")
    
    # Check permissions (only technician or admin can delete)
    if db_work_log.technician_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية لحذف سجل العمل هذا"
        )
    
    # Store case_id before deletion for activity log
    case_id = db_work_log.case_id
    
    work_log.delete(db=db, work_log_id=work_log_id)
    
    # Log activity
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=f"حذف سجل عمل"
    )
    
    return None


@router.get("/active/{technician_id}", response_model=WorkLogDetail)
async def get_active_work_log(
    technician_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get currently active work log for a technician (without end_time).
    """
    active_log = work_log.get_active_work_log(
        db=db,
        technician_id=technician_id
    )
    
    if not active_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا توجد جلسة عمل نشطة لهذا الفني"
        )
    
    return active_log


@router.post("/start/{case_id}", response_model=WorkLogSchema, status_code=status.HTTP_201_CREATED)
async def start_work(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Start work on a case. Utility endpoint to easily create a new work log.
    """
    # Check if user already has an active work log
    active_log = work_log.get_active_work_log(
        db=db,
        technician_id=current_user.id
    )
    
    if active_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لديك جلسة عمل نشطة بالفعل. يرجى إنهاؤها قبل بدء جلسة جديدة."
        )
    
    # Create new work log
    work_log_in = WorkLogCreate(
        case_id=case_id,
        technician_id=current_user.id,
        start_time=datetime.utcnow(),
        end_time=None,
        total_duration=None
    )
    
    db_work_log = work_log.create(
        db=db,
        obj_in=work_log_in
    )
    
    # Log activity
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=f"بدأ العمل على الحالة"
    )
    
    return db_work_log


@router.post("/end", response_model=WorkLogSchema)
async def end_work(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    End current work session for the technician.
    """
    # Find active work log
    active_log = work_log.get_active_work_log(
        db=db,
        technician_id=current_user.id
    )
    
    if not active_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ليس لديك جلسة عمل نشطة حالياً"
        )
    
    # End the work log
    end_time = datetime.utcnow()
    duration = int((end_time - active_log.start_time).total_seconds())
    
    work_log_update = WorkLogUpdate(
        end_time=end_time,
        total_duration=duration
    )
    
    db_work_log = work_log.update(
        db=db,
        db_obj=active_log,
        obj_in=work_log_update
    )
    
    # Log activity
    create_activity(
        db=db,
        case_id=active_log.case_id,
        performed_by=current_user.id,
        action=f"أنهى العمل على الحالة"
    )
    
    return db_work_log


@router.get("/stats/summary", response_model=Dict[str, int])
async def get_work_time_summary(
    days: int = 30,
    technician_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get work time summary for the past N days.
    """
    # If technician_id is not provided, use current user
    if not technician_id:
        technician_id = current_user.id
    
    # Only admin can view other technicians' summaries
    if technician_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية للوصول إلى ملخص وقت العمل لهذا الفني"
        )
    
    return work_log.get_work_time_summary(
        db=db,
        days=days,
        technician_id=technician_id
    )
