from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
import logging

from app.crud.notification import notification as notification_crud
from app.schemas.notification import NotificationCreate
from app.websockets.connection_manager import manager

logger = logging.getLogger(__name__)


async def send_notification(
    user_id: UUID,
    message: str,
    related_case_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None,
    db: Optional[Session] = None
):
    """
    إرسال إشعار لمستخدم وتخزينه في قاعدة البيانات
    
    Args:
        user_id: معرف المستخدم المستلم
        message: نص الإشعار
        related_case_id: معرف الحالة المرتبطة (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
        db: جلسة قاعدة البيانات (اختياري، إذا تم تمريرها سيتم تخزين الإشعار)
    """
    # Send via websocket if user is connected
    notification_data = {
        "type": "notification",
        "message": message,
        "related_case_id": str(related_case_id) if related_case_id else None
    }
    
    # If we have background tasks object, send notification in the background
    if background_tasks:
        background_tasks.add_task(
            manager.send_notification_to_user,
            user_id=user_id,
            message=notification_data
        )
    else:
        # Otherwise send it immediately
        await manager.send_notification_to_user(
            user_id=user_id,
            message=notification_data
        )
    
    # Store in database if db session is provided
    if db:
        notification_in = NotificationCreate(
            recipient_id=user_id,
            message=message,
            related_case_id=related_case_id
        )
        
        try:
            notification_crud.create(db=db, obj_in=notification_in)
            logger.info(f"Notification stored for user {user_id}")
        except Exception as e:
            logger.error(f"Error storing notification for user {user_id}: {str(e)}")


async def send_case_notification(
    db: Session,
    case_id: UUID,
    message: str,
    recipient_ids: List[UUID],
    exclude_user_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار متعلق بحالة لعدة مستخدمين
    
    Args:
        db: جلسة قاعدة البيانات
        case_id: معرف الحالة
        message: نص الإشعار
        recipient_ids: قائمة معرفات المستخدمين المستلمين
        exclude_user_id: معرف المستخدم الذي يجب استبعاده (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    for recipient_id in recipient_ids:
        if exclude_user_id and recipient_id == exclude_user_id:
            continue
        
        await send_notification(
            user_id=recipient_id,
            message=message,
            related_case_id=case_id,
            background_tasks=background_tasks,
            db=db
        )


async def send_system_notification(
    db: Session,
    message: str,
    recipient_ids: List[UUID],
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار نظام لعدة مستخدمين (غير مرتبط بحالة محددة)
    
    Args:
        db: جلسة قاعدة البيانات
        message: نص الإشعار
        recipient_ids: قائمة معرفات المستخدمين المستلمين
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    for recipient_id in recipient_ids:
        await send_notification(
            user_id=recipient_id,
            message=message,
            background_tasks=background_tasks,
            db=db
        )


async def broadcast_system_notification(
    db: Session,
    message: str,
    exclude_user_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    بث إشعار نظام لجميع المستخدمين المتصلين
    
    Args:
        db: جلسة قاعدة البيانات
        message: نص الإشعار
        exclude_user_id: معرف المستخدم الذي يجب استبعاده (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    notification_data = {
        "type": "system_notification",
        "message": message
    }
    
    # Send via websocket
    if background_tasks:
        background_tasks.add_task(
            manager.broadcast,
            message=notification_data,
            exclude_user=exclude_user_id
        )
    else:
        await manager.broadcast(
            message=notification_data,
            exclude_user=exclude_user_id
        )
    
    # Store in database - we'll need to query for all active users
    # This part would require retrieving all active users from the database
    # For simplicity, we'll comment this out and expect the calling code to handle
    # storing notifications for relevant users
    # from app.crud.user import user as user_crud
    # active_users = user_crud.get_active_users(db=db)
    # for user in active_users:
    #     if exclude_user_id and user.id == exclude_user_id:
    #         continue
    #     await send_notification(user_id=user.id, message=message, db=db)


def get_unread_notification_count(db: Session, user_id: UUID) -> int:
    """
    الحصول على عدد الإشعارات غير المقروءة لمستخدم
    
    Args:
        db: جلسة قاعدة البيانات
        user_id: معرف المستخدم
        
    Returns:
        عدد الإشعارات غير المقروءة
    """
    return notification_crud.get_unread_count(db=db, recipient_id=user_id)


def mark_notification_as_read(db: Session, notification_id: UUID) -> Optional[Dict[str, Any]]:
    """
    تحديد إشعار كمقروء
    
    Args:
        db: جلسة قاعدة البيانات
        notification_id: معرف الإشعار
        
    Returns:
        الإشعار المحدث أو None إذا لم يتم العثور عليه
    """
    db_obj = notification_crud.mark_as_read(db=db, notification_id=notification_id)
    if not db_obj:
        return None
    
    return {
        "id": db_obj.id,
        "message": db_obj.message,
        "is_read": db_obj.is_read,
        "created_at": db_obj.created_at
    }


def mark_all_notifications_as_read(db: Session, user_id: UUID) -> int:
    """
    تحديد جميع إشعارات المستخدم كمقروءة
    
    Args:
        db: جلسة قاعدة البيانات
        user_id: معرف المستخدم
        
    Returns:
        عدد الإشعارات التي تم تحديثها
    """
    return notification_crud.mark_all_as_read(db=db, recipient_id=user_id)
