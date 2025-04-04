from sqlalchemy.orm import Session
from uuid import UUID

from app.models.activity import Activity


def create_activity(db: Session, case_id: UUID, performed_by: UUID, action: str) -> Activity:
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
    db_activity = Activity(
        case_id=case_id,
        performed_by=performed_by,
        action=action
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def get_case_activities(db: Session, case_id: UUID, skip: int = 0, limit: int = 100):
    """
    Get activities for a specific case
    
    Args:
        db: Database session
        case_id: ID of the case
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        
    Returns:
        List of activities
    """
    return db.query(Activity).filter(
        Activity.case_id == case_id
    ).order_by(
        Activity.created_at.desc()
    ).offset(skip).limit(limit).all()
