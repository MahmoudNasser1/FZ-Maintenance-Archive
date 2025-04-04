from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
import logging
from datetime import datetime

from app.crud.notification import notification as notification_crud
from app.schemas.notification import NotificationCreate
from app.websockets.connection_manager import manager
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.crud.user import user as user_crud

logger = logging.getLogger(__name__)


async def send_notification(
    user_id: UUID,
    message: str,
    notification_type: str = "info",
    related_case_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None,
    db: Optional[Session] = None
):
    """
    إرسال إشعار لمستخدم وتخزينه في قاعدة البيانات
    
    Args:
        user_id: معرف المستخدم المستلم
        message: نص الإشعار
        notification_type: نوع الإشعار (info, warning, success, error)
        related_case_id: معرف الحالة المرتبطة (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
        db: جلسة قاعدة البيانات (اختياري، إذا تم تمريرها سيتم تخزين الإشعار)
    """
    # Send via websocket if user is connected
    notification_data = {
        "type": "notification",
        "notification_type": notification_type,
        "message": message,
        "related_case_id": str(related_case_id) if related_case_id else None,
        "timestamp": datetime.now().isoformat()
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
    
    # Store in database if db session provided
    if db:
        notification_create = NotificationCreate(
            recipient_id=user_id,
            message=message,
            notification_type=notification_type,
            related_case_id=related_case_id
        )
        notification_crud.create(db=db, obj_in=notification_create)


async def send_case_notification(
    db: Session,
    case_id: UUID,
    message: str,
    notification_type: str = "info",
    recipient_ids: List[UUID] = None,
    roles: List[str] = None,
    exclude_user_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار متعلق بحالة لعدة مستخدمين
    
    Args:
        db: جلسة قاعدة البيانات
        case_id: معرف الحالة
        message: نص الإشعار
        notification_type: نوع الإشعار (info, warning, success, error)
        recipient_ids: قائمة معرفات المستخدمين المستلمين (اختياري)
        roles: قائمة الأدوار التي يجب إرسال الإشعار لها (اختياري)
        exclude_user_id: معرف المستخدم الذي يجب استبعاده (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    # Get case details to include in notifications
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        logger.error(f"Case with ID {case_id} not found for notification")
        return
    
    # If recipient_ids is not provided, determine recipients based on roles
    if not recipient_ids:
        if not roles:
            # Default to technicians and managers
            roles = ["technician", "manager", "admin"]
        
        # Get users with specified roles
        recipients = db.query(User).filter(User.role.in_(roles)).all()
        recipient_ids = [user.id for user in recipients]
        
        # Always include the technician assigned to the case
        if case.technician_id and case.technician_id not in recipient_ids:
            recipient_ids.append(case.technician_id)
    
    # Exclude specified user
    if exclude_user_id and exclude_user_id in recipient_ids:
        recipient_ids.remove(exclude_user_id)
    
    # Send notification to each recipient
    for recipient_id in recipient_ids:
        await send_notification(
            user_id=recipient_id,
            message=message,
            notification_type=notification_type,
            related_case_id=case_id,
            background_tasks=background_tasks,
            db=db
        )


async def send_status_change_notification(
    db: Session,
    case_id: UUID,
    old_status: CaseStatus,
    new_status: CaseStatus,
    changed_by_id: UUID,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار عند تغيير حالة القضية
    
    Args:
        db: جلسة قاعدة البيانات
        case_id: معرف الحالة
        old_status: الحالة القديمة
        new_status: الحالة الجديدة
        changed_by_id: معرف المستخدم الذي قام بالتغيير
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        logger.error(f"Case with ID {case_id} not found for notification")
        return
    
    # Get the user who made the change
    changed_by = user_crud.get(db, id=changed_by_id)
    changed_by_name = changed_by.full_name if changed_by else "مستخدم غير معروف"
    
    # Create the notification message
    case_number = case.case_number or str(case.id)
    message = f"تم تغيير حالة القضية #{case_number} من {old_status.value} إلى {new_status.value} بواسطة {changed_by_name}"
    
    # Determine notification type based on status
    notification_type = "info"
    if new_status == CaseStatus.resolved:
        notification_type = "success"
    elif new_status == CaseStatus.on_hold:
        notification_type = "warning"
    
    # Send to technician if assigned
    if case.technician_id:
        await send_notification(
            user_id=case.technician_id,
            message=message,
            notification_type=notification_type,
            related_case_id=case_id,
            background_tasks=background_tasks,
            db=db
        )
    
    # Send to managers and admins
    managers = db.query(User).filter(User.role.in_(["manager", "admin"])).all()
    for manager in managers:
        # Don't send to the user who made the change
        if manager.id != changed_by_id:
            await send_notification(
                user_id=manager.id,
                message=message,
                notification_type=notification_type,
                related_case_id=case_id,
                background_tasks=background_tasks,
                db=db
            )


async def send_technician_assignment_notification(
    db: Session,
    case_id: UUID,
    technician_id: UUID,
    assigned_by_id: UUID,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار عند تعيين فني لحالة
    
    Args:
        db: جلسة قاعدة البيانات
        case_id: معرف الحالة
        technician_id: معرف الفني
        assigned_by_id: معرف المستخدم الذي قام بالتعيين
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        logger.error(f"Case with ID {case_id} not found for notification")
        return
    
    technician = user_crud.get(db, id=technician_id)
    if not technician:
        logger.error(f"Technician with ID {technician_id} not found for notification")
        return
    
    assigned_by = user_crud.get(db, id=assigned_by_id)
    assigned_by_name = assigned_by.full_name if assigned_by else "مستخدم غير معروف"
    
    # Create notification for the technician
    case_number = case.case_number or str(case.id)
    tech_message = f"تم تعيينك لحالة الصيانة #{case_number} ({case.device_model or 'جهاز'}) - {case.client_name}"
    
    await send_notification(
        user_id=technician_id,
        message=tech_message,
        notification_type="info",
        related_case_id=case_id,
        background_tasks=background_tasks,
        db=db
    )
    
    # Notify managers
    manager_message = f"تم تعيين {technician.full_name} لحالة الصيانة #{case_number} بواسطة {assigned_by_name}"
    
    managers = db.query(User).filter(User.role.in_(["manager", "admin"])).all()
    for manager in managers:
        # Don't send to the user who made the assignment
        if manager.id != assigned_by_id:
            await send_notification(
                user_id=manager.id,
                message=manager_message,
                notification_type="info",
                related_case_id=case_id,
                background_tasks=background_tasks,
                db=db
            )


async def send_batch_update_notification(
    db: Session,
    case_ids: List[UUID],
    update_type: str,
    update_details: Optional[str],
    updated_by_id: UUID,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار عند تحديث مجموعة من الحالات
    
    Args:
        db: جلسة قاعدة البيانات
        case_ids: قائمة معرفات الحالات المحدثة
        update_type: نوع التحديث (status, technician, priority, etc)
        update_details: تفاصيل التحديث
        updated_by_id: معرف المستخدم الذي قام بالتحديث
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    if not case_ids:
        return
    
    updated_by = user_crud.get(db, id=updated_by_id)
    updated_by_name = updated_by.full_name if updated_by else "مستخدم غير معروف"
    
    # Create a mapping of update types to readable names
    update_type_names = {
        "status": "حالة",
        "technician": "فني",
        "priority": "أولوية",
        "delete": "حذف",
    }
    
    update_type_name = update_type_names.get(update_type, update_type)
    
    # Basic notification message
    message = f"تم تحديث {update_type_name} {len(case_ids)} حالة بواسطة {updated_by_name}"
    if update_details:
        message += f" - {update_details}"
    
    # For technician assignments, notify each assigned technician
    technician_ids = set()
    if update_type == "technician" and update_details:
        # Assume update_details is the technician ID as string
        try:
            technician_id = UUID(update_details)
            technician_ids.add(technician_id)
        except ValueError:
            pass
    
    # Collect all technicians associated with the cases
    cases = db.query(Case).filter(Case.id.in_(case_ids)).all()
    for case in cases:
        if case.technician_id:
            technician_ids.add(case.technician_id)
    
    # Send notification to all technicians involved
    for technician_id in technician_ids:
        if technician_id != updated_by_id:  # Don't notify the user who made the update
            tech_message = f"تم تحديث {len(case_ids)} حالة من قبل {updated_by_name} - تحقق من الحالات المعينة لك"
            await send_notification(
                user_id=technician_id,
                message=tech_message,
                notification_type="info",
                background_tasks=background_tasks,
                db=db
            )
    
    # Notify managers and admins
    managers = db.query(User).filter(User.role.in_(["manager", "admin"])).all()
    for manager in managers:
        if manager.id != updated_by_id:  # Don't notify the user who made the update
            await send_notification(
                user_id=manager.id,
                message=message,
                notification_type="info",
                background_tasks=background_tasks,
                db=db
            )


async def send_system_notification(
    db: Session,
    message: str,
    notification_type: str = "info",
    recipient_ids: List[UUID] = None,
    roles: List[str] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    إرسال إشعار نظام لعدة مستخدمين
    
    Args:
        db: جلسة قاعدة البيانات
        message: نص الإشعار
        notification_type: نوع الإشعار (info, warning, success, error)
        recipient_ids: قائمة معرفات المستخدمين المستلمين (اختياري)
        roles: قائمة الأدوار التي يجب إرسال الإشعار لها (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    # If recipient_ids is not provided, determine recipients based on roles
    if not recipient_ids:
        if not roles:
            # Default to all users
            users = db.query(User).filter(User.is_active == True).all()
        else:
            # Get users with specified roles
            users = db.query(User).filter(User.role.in_(roles), User.is_active == True).all()
        
        recipient_ids = [user.id for user in users]
    
    # Send notification to each recipient
    for recipient_id in recipient_ids:
        await send_notification(
            user_id=recipient_id,
            message=message,
            notification_type=notification_type,
            background_tasks=background_tasks,
            db=db
        )


async def broadcast_system_notification(
    db: Session,
    message: str,
    notification_type: str = "info",
    exclude_user_id: Optional[UUID] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    بث إشعار نظام لجميع المستخدمين المتصلين
    
    Args:
        db: جلسة قاعدة البيانات
        message: نص الإشعار
        notification_type: نوع الإشعار (info, warning, success, error)
        exclude_user_id: معرف المستخدم الذي يجب استبعاده (اختياري)
        background_tasks: مهام خلفية FastAPI (اختياري)
    """
    # Data to broadcast
    notification_data = {
        "type": "notification",
        "notification_type": notification_type,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to all connected clients
    if background_tasks:
        background_tasks.add_task(
            manager.broadcast,
            message=notification_data,
            exclude_user_id=exclude_user_id
        )
    else:
        await manager.broadcast(
            message=notification_data,
            exclude_user_id=exclude_user_id
        )
    
    # Store in database for all active users
    users = db.query(User).filter(User.is_active == True).all()
    for user in users:
        if not exclude_user_id or user.id != exclude_user_id:
            notification_create = NotificationCreate(
                recipient_id=user.id,
                message=message,
                notification_type=notification_type
            )
            notification_crud.create(db=db, obj_in=notification_create)


# Re-export these utility functions from the original notification service
from app.services.notification_service import (
    get_unread_notification_count,
    mark_notification_as_read,
    mark_all_notifications_as_read
)
