from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.models.work_log import WorkLog
from app.schemas.work_log import WorkLogCreate, WorkLogUpdate


class CRUDWorkLog:
    def get(self, db: Session, work_log_id: UUID) -> Optional[WorkLog]:
        """
        Get a work log by ID
        """
        return db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        case_id: Optional[UUID] = None,
        technician_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[WorkLog]:
        """
        Get multiple work logs with filtering and pagination
        """
        query = db.query(WorkLog)
        
        # Apply filters
        if case_id:
            query = query.filter(WorkLog.case_id == case_id)
        
        if technician_id:
            query = query.filter(WorkLog.technician_id == technician_id)
        
        if start_date:
            query = query.filter(WorkLog.start_time >= start_date)
        
        if end_date:
            query = query.filter(WorkLog.start_time <= end_date)
        
        # Apply sorting (newest first)
        query = query.order_by(WorkLog.start_time.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def create(
        self, 
        db: Session, 
        *, 
        obj_in: WorkLogCreate
    ) -> WorkLog:
        """
        Create a new work log
        """
        db_obj = WorkLog(
            technician_id=obj_in.technician_id,
            case_id=obj_in.case_id,
            start_time=obj_in.start_time,
            end_time=obj_in.end_time,
            total_duration=obj_in.total_duration
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: WorkLog, obj_in: Union[WorkLogUpdate, Dict[str, Any]]
    ) -> WorkLog:
        """
        Update a work log
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Calculate total duration if end_time is provided
        if 'end_time' in update_data and update_data['end_time'] and not 'total_duration' in update_data:
            end_time = update_data['end_time']
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            start_time = db_obj.start_time
            duration = (end_time - start_time).total_seconds()
            update_data['total_duration'] = int(duration)
        
        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, work_log_id: UUID) -> WorkLog:
        """
        Delete a work log
        """
        obj = db.query(WorkLog).get(work_log_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_active_work_log(
        self, 
        db: Session, 
        *, 
        technician_id: UUID,
        case_id: Optional[UUID] = None
    ) -> Optional[WorkLog]:
        """
        Get active work log (with no end_time) for a technician
        """
        query = db.query(WorkLog).filter(
            WorkLog.technician_id == technician_id,
            WorkLog.end_time == None
        )
        
        if case_id:
            query = query.filter(WorkLog.case_id == case_id)
        
        return query.first()
    
    def get_total_work_time(
        self,
        db: Session,
        *,
        case_id: Optional[UUID] = None,
        technician_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """
        Get total work time in seconds
        """
        query = db.query(func.sum(WorkLog.total_duration)).filter(WorkLog.total_duration != None)
        
        if case_id:
            query = query.filter(WorkLog.case_id == case_id)
        
        if technician_id:
            query = query.filter(WorkLog.technician_id == technician_id)
        
        if start_date:
            query = query.filter(WorkLog.start_time >= start_date)
        
        if end_date:
            query = query.filter(WorkLog.start_time <= end_date)
        
        result = query.scalar()
        return result or 0
    
    def get_work_time_summary(
        self,
        db: Session,
        *,
        days: int = 30,
        technician_id: Optional[UUID] = None
    ) -> Dict[str, int]:
        """
        Get daily work time summary for the past N days in seconds
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Format date as string for grouping
        date_format = db.func.date_trunc('day', WorkLog.start_time)
        
        query = db.query(
            date_format.label('date'),
            func.sum(WorkLog.total_duration).label('duration')
        ).filter(WorkLog.total_duration != None)
        
        if technician_id:
            query = query.filter(WorkLog.technician_id == technician_id)
        
        query = query.filter(WorkLog.start_time >= start_date)
        query = query.group_by('date')
        query = query.order_by('date')
        
        result = query.all()
        
        # Convert to dictionary with date strings as keys
        summary = {}
        for date, duration in result:
            date_str = date.strftime('%Y-%m-%d')
            summary[date_str] = duration or 0
        
        return summary


work_log = CRUDWorkLog()
