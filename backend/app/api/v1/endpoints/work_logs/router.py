from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.work_log import WorkLog
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
    query = db.query(WorkLog)
    
    if case_id:
        query = query.filter(WorkLog.case_id == case_id)
    
    if technician_id:
        query = query.filter(WorkLog.technician_id == technician_id)
    
    if start_date:
        query = query.filter(WorkLog.start_time >= start_date)
    
    if end_date:
        query = query.filter(WorkLog.start_time <= end_date)
    
    work_logs = query.order_by(WorkLog.start_time.desc()).offset(skip).limit(limit).all()
    return work_logs


@router.post("/", response_model=WorkLogSchema)
async def create_work_log(
    work_log_in: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new work log entry.
    """
    # Calculate duration if end_time is provided
    total_duration = None
    if work_log_in.end_time:
        duration = work_log_in.end_time - work_log_in.start_time
        total_duration = int(duration.total_seconds())
    
    db_work_log = WorkLog(
        technician_id=work_log_in.technician_id,
        case_id=work_log_in.case_id,
        start_time=work_log_in.start_time,
        end_time=work_log_in.end_time,
        total_duration=total_duration,
    )
    
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    
    # Log activity
    create_activity(
        db=db,
        case_id=work_log_in.case_id,
        performed_by=current_user.id,
        action=f"بدأ العمل على حالة الصيانة"
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
    work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not work_log:
        raise HTTPException(
            status_code=404,
            detail="Work log not found",
        )
    return work_log


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
    work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not work_log:
        raise HTTPException(
            status_code=404,
            detail="Work log not found",
        )
    
    update_data = work_log_in.model_dump(exclude_unset=True)
    
    # Recalculate duration if end_time is provided
    if work_log_in.end_time:
        duration = work_log_in.end_time - work_log.start_time
        update_data["total_duration"] = int(duration.total_seconds())
    
    for field, value in update_data.items():
        setattr(work_log, field, value)
    
    db.add(work_log)
    db.commit()
    db.refresh(work_log)
    
    # Log activity if work session ended
    if work_log_in.end_time and not work_log.end_time:
        create_activity(
            db=db,
            case_id=work_log.case_id,
            performed_by=current_user.id,
            action=f"أنهى العمل على حالة الصيانة"
        )
    
    return work_log


@router.delete("/{work_log_id}", response_model=WorkLogSchema)
async def delete_work_log(
    work_log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete work log.
    """
    work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not work_log:
        raise HTTPException(
            status_code=404,
            detail="Work log not found",
        )
    
    # Check permissions (only admin or the technician can delete)
    if work_log.technician_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this work log",
        )
    
    db.delete(work_log)
    db.commit()
    
    return work_log


@router.get("/active/technician/{technician_id}", response_model=Optional[WorkLogDetail])
async def get_active_work_log(
    technician_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get currently active work log for a technician (without end_time).
    """
    active_work_log = db.query(WorkLog).filter(
        WorkLog.technician_id == technician_id,
        WorkLog.end_time == None
    ).order_by(WorkLog.start_time.desc()).first()
    
    return active_work_log


@router.post("/start-work/{case_id}", response_model=WorkLogSchema)
async def start_work(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Start work on a case. Utility endpoint to easily create a new work log.
    """
    # First check if there's already an active work log for this technician
    active_work_log = db.query(WorkLog).filter(
        WorkLog.technician_id == current_user.id,
        WorkLog.end_time == None
    ).first()
    
    if active_work_log:
        raise HTTPException(
            status_code=400,
            detail="You already have an active work session. Please end it before starting a new one.",
        )
    
    # Create new work log
    db_work_log = WorkLog(
        technician_id=current_user.id,
        case_id=case_id,
        start_time=datetime.utcnow(),
    )
    
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    
    # Log activity
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=f"بدأ العمل على حالة الصيانة"
    )
    
    return db_work_log


@router.post("/end-work", response_model=WorkLogSchema)
async def end_work(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    End current work session for the technician.
    """
    active_work_log = db.query(WorkLog).filter(
        WorkLog.technician_id == current_user.id,
        WorkLog.end_time == None
    ).order_by(WorkLog.start_time.desc()).first()
    
    if not active_work_log:
        raise HTTPException(
            status_code=404,
            detail="No active work session found",
        )
    
    # Update work log with end time
    end_time = datetime.utcnow()
    duration = end_time - active_work_log.start_time
    total_duration = int(duration.total_seconds())
    
    active_work_log.end_time = end_time
    active_work_log.total_duration = total_duration
    
    db.add(active_work_log)
    db.commit()
    db.refresh(active_work_log)
    
    # Log activity
    create_activity(
        db=db,
        case_id=active_work_log.case_id,
        performed_by=current_user.id,
        action=f"أنهى العمل على حالة الصيانة"
    )
    
    return active_work_log
