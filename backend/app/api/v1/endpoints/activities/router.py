from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.activity import Activity
from app.schemas.activity import Activity as ActivitySchema, ActivityWithUser
from app.services.activity_service import get_case_activities

router = APIRouter()


@router.get("/", response_model=List[ActivityWithUser])
async def read_activities(
    case_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve activities with optional filtering by case_id.
    """
    if case_id:
        activities = get_case_activities(db, case_id, skip, limit)
    else:
        activities = db.query(Activity).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
    
    return activities


@router.get("/{activity_id}", response_model=ActivityWithUser)
async def read_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get activity by ID.
    """
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )
    return activity


@router.get("/by-case/{case_id}", response_model=List[ActivityWithUser])
async def read_activities_by_case(
    case_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get activities for a specific case.
    """
    activities = get_case_activities(db, case_id, skip, limit)
    return activities


@router.get("/by-user/{user_id}", response_model=List[ActivityWithUser])
async def read_activities_by_user(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get activities performed by a specific user.
    """
    activities = db.query(Activity).filter(
        Activity.performed_by == user_id
    ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
    
    return activities


@router.get("/summary/by-case/{case_id}", response_model=List[ActivityWithUser])
async def get_case_activity_summary(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a summary of activities for a case (limited to most important activities).
    """
    # For a real application, we would implement logic to identify and return
    # the most important activities for the case. For now, we'll just return
    # the 10 most recent activities.
    activities = get_case_activities(db, case_id, 0, 10)
    return activities
