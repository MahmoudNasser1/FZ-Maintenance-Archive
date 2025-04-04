from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate, Case as CaseSchema, CaseList, CaseDetail
from app.services.activity_service import create_activity

router = APIRouter()


@router.get("/", response_model=List[CaseList])
async def read_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CaseStatus] = None,
    technician_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve cases with optional filtering.
    """
    query = db.query(Case)
    
    # Apply filters if provided
    if status:
        query = query.filter(Case.status == status)
    
    if technician_id:
        query = query.filter(Case.technician_id == technician_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Case.device_model.ilike(search_term)) | 
            (Case.serial_number.ilike(search_term)) | 
            (Case.client_name.ilike(search_term))
        )
    
    total = query.count()
    cases = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    
    return cases


@router.post("/", response_model=CaseSchema)
async def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new case.
    """
    # Check if serial number already exists
    if case_in.serial_number:
        existing_case = db.query(Case).filter(Case.serial_number == case_in.serial_number).first()
        if existing_case:
            raise HTTPException(
                status_code=400,
                detail="A case with this serial number already exists",
            )
    
    # Create case
    db_case = Case(
        device_model=case_in.device_model,
        serial_number=case_in.serial_number,
        client_name=case_in.client_name,
        client_phone=case_in.client_phone,
        issue_description=case_in.issue_description,
        diagnosis=case_in.diagnosis,
        solution=case_in.solution,
        status=case_in.status,
        technician_id=case_in.technician_id,
    )
    
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
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
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    return case


@router.put("/{case_id}", response_model=CaseSchema)
async def update_case(
    case_id: UUID,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    
    # Check serial number uniqueness if it's being updated
    if case_in.serial_number and case_in.serial_number != case.serial_number:
        existing_case = db.query(Case).filter(Case.serial_number == case_in.serial_number).first()
        if existing_case:
            raise HTTPException(
                status_code=400,
                detail="A case with this serial number already exists",
            )
    
    # Track status change for activity log
    old_status = case.status
    
    # Update case attributes
    update_data = case_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    db.add(case)
    db.commit()
    db.refresh(case)
    
    # Log status change if it occurred
    if case_in.status and old_status != case.status:
        create_activity(
            db=db,
            case_id=case.id,
            performed_by=current_user.id,
            action=f"تم تغيير حالة الصيانة من {old_status} إلى {case.status}"
        )
    else:
        create_activity(
            db=db,
            case_id=case.id,
            performed_by=current_user.id,
            action=f"تم تحديث بيانات حالة الصيانة"
        )
    
    return case


@router.delete("/{case_id}", response_model=CaseSchema)
async def delete_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    
    # Instead of actually deleting, we could implement soft delete by adding a deleted flag
    # For now, we'll do a hard delete
    db.delete(case)
    db.commit()
    
    return case


@router.get("/by-serial/{serial_number}", response_model=CaseDetail)
async def read_case_by_serial(
    serial_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get case by serial number.
    """
    case = db.query(Case).filter(Case.serial_number == serial_number).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )
    return case


@router.get("/by-client/{client_name}", response_model=List[CaseList])
async def read_cases_by_client(
    client_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get cases by client name (partial match).
    """
    cases = db.query(Case).filter(Case.client_name.ilike(f"%{client_name}%")).all()
    return cases
