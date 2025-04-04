from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate


class CRUDNotification:
    def get(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        """
        Get a notification by ID
        """
        return db.query(Notification).filter(Notification.id == notification_id).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        recipient_id: Optional[UUID] = None,
        is_read: Optional[bool] = None,
        related_case_id: Optional[UUID] = None
    ) -> List[Notification]:
        """
        Get multiple notifications with filtering and pagination
        """
        query = db.query(Notification)
        
        # Apply filters
        if recipient_id:
            query = query.filter(Notification.recipient_id == recipient_id)
        
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        
        if related_case_id:
            query = query.filter(Notification.related_case_id == related_case_id)
        
        # Apply sorting (newest first)
        query = query.order_by(Notification.created_at.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def create(
        self, 
        db: Session, 
        *, 
        obj_in: NotificationCreate
    ) -> Notification:
        """
        Create a new notification
        """
        db_obj = Notification(
            recipient_id=obj_in.recipient_id,
            message=obj_in.message,
            is_read=obj_in.is_read,
            related_case_id=obj_in.related_case_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: Notification, obj_in: Union[NotificationUpdate, Dict[str, Any]]
    ) -> Notification:
        """
        Update a notification
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, notification_id: UUID) -> Notification:
        """
        Delete a notification
        """
        obj = db.query(Notification).get(notification_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def mark_as_read(self, db: Session, *, notification_id: UUID) -> Notification:
        """
        Mark a notification as read
        """
        db_obj = self.get(db=db, notification_id=notification_id)
        if db_obj:
            db_obj.is_read = True
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj
    
    def mark_all_as_read(self, db: Session, *, recipient_id: UUID) -> int:
        """
        Mark all notifications for a recipient as read
        Returns the number of notifications updated
        """
        result = db.query(Notification).filter(
            Notification.recipient_id == recipient_id,
            Notification.is_read == False
        ).update({Notification.is_read: True})
        
        db.commit()
        return result
    
    def get_unread_count(self, db: Session, *, recipient_id: UUID) -> int:
        """
        Get count of unread notifications for a recipient
        """
        return db.query(Notification).filter(
            Notification.recipient_id == recipient_id,
            Notification.is_read == False
        ).count()
    
    def delete_old_notifications(self, db: Session, *, days: int = 30) -> int:
        """
        Delete notifications older than specified days
        Returns the number of notifications deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).delete()
        
        db.commit()
        return result


notification = CRUDNotification()
