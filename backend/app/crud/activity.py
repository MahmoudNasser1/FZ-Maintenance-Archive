from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.activity import Activity
from app.schemas.activity import ActivityCreate


class CRUDActivity:
    def get(self, db: Session, activity_id: UUID) -> Optional[Activity]:
        """
        Get an activity by ID
        """
        return db.query(Activity).filter(Activity.id == activity_id).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        case_id: Optional[UUID] = None,
        performed_by: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Activity]:
        """
        Get multiple activities with filtering and pagination
        """
        query = db.query(Activity)
        
        # Apply filters
        if case_id:
            query = query.filter(Activity.case_id == case_id)
        
        if performed_by:
            query = query.filter(Activity.performed_by == performed_by)
        
        if start_date:
            query = query.filter(Activity.created_at >= start_date)
        
        if end_date:
            query = query.filter(Activity.created_at <= end_date)
        
        # Apply sorting (newest first)
        query = query.order_by(Activity.created_at.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def create(
        self, 
        db: Session, 
        *, 
        case_id: UUID, 
        performed_by: UUID, 
        action: str
    ) -> Activity:
        """
        Create a new activity
        """
        db_obj = Activity(
            case_id=case_id,
            action=action,
            performed_by=performed_by
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, activity_id: UUID) -> Activity:
        """
        Delete an activity
        """
        obj = db.query(Activity).get(activity_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_recent_activities(
        self, 
        db: Session, 
        *, 
        case_id: Optional[UUID] = None, 
        days: int = 7, 
        limit: int = 20
    ) -> List[Activity]:
        """
        Get recent activities within the past N days
        """
        query = db.query(Activity)
        
        if case_id:
            query = query.filter(Activity.case_id == case_id)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Activity.created_at >= start_date)
        
        return query.order_by(Activity.created_at.desc()).limit(limit).all()
    
    def get_daily_activity_counts(
        self, 
        db: Session, 
        *, 
        days: int = 30,
        case_id: Optional[UUID] = None
    ) -> Dict[str, int]:
        """
        Get daily activity counts for the past N days
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Format date as string for grouping
        date_format = db.func.date_trunc('day', Activity.created_at)
        
        query = db.query(
            date_format.label('date'),
            db.func.count(Activity.id).label('count')
        )
        
        if case_id:
            query = query.filter(Activity.case_id == case_id)
        
        query = query.filter(Activity.created_at >= start_date)
        query = query.group_by('date')
        query = query.order_by('date')
        
        result = query.all()
        
        # Convert to dictionary with date strings as keys
        counts = {}
        for date, count in result:
            date_str = date.strftime('%Y-%m-%d')
            counts[date_str] = count
        
        return counts


activity = CRUDActivity()
