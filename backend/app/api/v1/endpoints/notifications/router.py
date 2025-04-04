from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, Notification as NotificationSchema

router = APIRouter()


@router.get("/", response_model=List[NotificationSchema])
async def read_notifications(
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve notifications for the current user.
    """
    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.post("/", response_model=NotificationSchema)
async def create_notification(
    notification_in: NotificationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new notification for a user.
    Admin or manager role required.
    """
    # Check if user has permission (admin or manager)
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to create notifications",
        )
    
    # Create notification
    db_notification = Notification(
        recipient_id=notification_in.recipient_id,
        message=notification_in.message,
        is_read=notification_in.is_read,
        related_case_id=notification_in.related_case_id,
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # In a real application, we would emit a WebSocket event here
    # background_tasks.add_task(notify_client, db_notification.recipient_id, db_notification)
    
    return db_notification


@router.put("/{notification_id}/read", response_model=NotificationSchema)
async def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Mark a notification as read.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )
    
    # Check if the notification belongs to the current user
    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this notification",
        )
    
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


@router.put("/read-all", response_model=List[NotificationSchema])
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Mark all notifications for the current user as read.
    """
    notifications = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False
    ).all()
    
    for notification in notifications:
        notification.is_read = True
        db.add(notification)
    
    db.commit()
    
    # Refresh all notifications
    for i, notification in enumerate(notifications):
        db.refresh(notification)
    
    return notifications


@router.delete("/{notification_id}", response_model=NotificationSchema)
async def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a notification.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )
    
    # Check if the notification belongs to the current user or user is admin
    if notification.recipient_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this notification",
        )
    
    db.delete(notification)
    db.commit()
    
    return notification


@router.delete("/", response_model=List[NotificationSchema])
async def delete_all_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete all read notifications for the current user.
    """
    notifications = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == True
    ).all()
    
    # Store notifications to return them later
    notifications_to_return = [notification for notification in notifications]
    
    for notification in notifications:
        db.delete(notification)
    
    db.commit()
    
    return notifications_to_return


# In a real application, we would have WebSocket support for real-time notifications
# @router.websocket("/ws/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await connection_manager.connect(websocket, user_id)
#     try:
#         while True:
#             data = await websocket.receive_text()
#             # Process incoming WebSocket messages if needed
#     except WebSocketDisconnect:
#         connection_manager.disconnect(websocket, user_id)
