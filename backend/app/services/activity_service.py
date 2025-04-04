from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timedelta

from app.crud.activity import activity


def create_activity(db: Session, case_id: UUID, performed_by: UUID, action: str):
    """
    Create an activity log entry for a case
    
    Args:
        db: Database session
        case_id: ID of the case
        performed_by: ID of the user who performed the action
        action: Description of the action
        
    Returns:
        Created activity instance
    """
    return activity.create(
        db=db,
        case_id=case_id,
        performed_by=performed_by,
        action=action
    )


def get_case_activities(db: Session, case_id: UUID, skip: int = 0, limit: int = 100):
    """
    Get activities for a specific case
    
    Args:
        db: Database session
        case_id: ID of the case
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of activities
    """
    return activity.get_multi(
        db=db,
        case_id=case_id,
        skip=skip,
        limit=limit
    )


def get_recent_activities(
    db: Session, 
    days: int = 7, 
    limit: int = 20, 
    case_id: Optional[UUID] = None
) -> List:
    """
    Get recent activities within the specified number of days
    
    Args:
        db: Database session
        days: Number of days to look back
        limit: Maximum number of records to return
        case_id: Optional case ID to filter activities
        
    Returns:
        List of recent activities
    """
    return activity.get_recent_activities(
        db=db,
        days=days,
        limit=limit,
        case_id=case_id
    )


def get_daily_activity_counts(
    db: Session, 
    days: int = 30,
    case_id: Optional[UUID] = None
):
    """
    Get daily activity counts for the specified number of days
    
    Args:
        db: Database session
        days: Number of days to analyze
        case_id: Optional case ID to filter activities
        
    Returns:
        Dictionary with dates as keys and activity counts as values
    """
    return activity.get_daily_activity_counts(
        db=db,
        days=days,
        case_id=case_id
    )
