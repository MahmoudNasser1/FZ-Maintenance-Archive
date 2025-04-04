from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_active_user, get_current_user_from_token
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, Notification as NotificationSchema
from app.crud.notification import notification as notification_crud
from app.websockets.connection_manager import manager
from app.services.notification_service import (
    send_notification, send_case_notification, 
    send_system_notification, broadcast_system_notification,
    get_unread_notification_count, mark_notification_as_read as mark_read,
    mark_all_notifications_as_read as mark_all_read
)

router = APIRouter()


@router.get("/", response_model=List[NotificationSchema], tags=["notifications"])
async def read_notifications(
    is_read: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    استرجاع إشعارات المستخدم الحالي
    
    يمكن تصفية النتائج حسب حالة القراءة (مقروء/غير مقروء)
    
    * **is_read**: تصفية حسب حالة القراءة
    * **skip**: عدد العناصر التي يتم تخطيها للتصفح الصفحي
    * **limit**: الحد الأقصى لعدد النتائج المُرجعة
    """
    return notification_crud.get_multi(
        db=db, 
        skip=skip, 
        limit=limit, 
        recipient_id=current_user.id,
        is_read=is_read
    )


@router.get("/count", response_model=int, tags=["notifications"])
async def read_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على عدد الإشعارات غير المقروءة للمستخدم الحالي
    
    يستخدم هذا لعرض عداد الإشعارات في واجهة المستخدم
    """
    return get_unread_notification_count(db=db, user_id=current_user.id)


@router.post("/", response_model=NotificationSchema, status_code=status.HTTP_201_CREATED, tags=["notifications"])
async def create_notification(
    notification_in: NotificationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    إنشاء إشعار جديد لمستخدم
    
    مطلوب دور مسؤول أو مدير
    
    * **notification_in**: بيانات الإشعار الجديد
    * يجب تحديد المستخدم المستلم والرسالة
    * سيتم إرسال الإشعار فورًا عبر WebSocket إذا كان المستخدم متصلاً
    """
    # التحقق من الصلاحيات
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحيات كافية لإنشاء إشعارات"
        )
    
    # إنشاء الإشعار في قاعدة البيانات
    db_notification = notification_crud.create(db=db, obj_in=notification_in)
    
    # إرسال الإشعار عبر WebSocket في الخلفية
    background_tasks.add_task(
        send_notification,
        user_id=notification_in.recipient_id,
        message=notification_in.message,
        related_case_id=notification_in.related_case_id,
        db=None  # لا نحتاج إلى تمرير db لأننا قمنا بالفعل بإنشاء الإشعار
    )
    
    return db_notification


@router.put("/{notification_id}/read", response_model=NotificationSchema, tags=["notifications"])
async def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    تحديد إشعار كمقروء
    
    * **notification_id**: معرف الإشعار المراد تحديده كمقروء
    * يمكن للمستخدم تحديد الإشعارات الخاصة به فقط
    """
    # التحقق من وجود الإشعار
    db_notification = notification_crud.get(db=db, notification_id=notification_id)
    if not db_notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الإشعار غير موجود"
        )
    
    # التحقق من أن الإشعار ينتمي للمستخدم الحالي
    if db_notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحيات للوصول إلى هذا الإشعار"
        )
    
    # تحديث الإشعار
    update_data = {"is_read": True}
    updated_notification = notification_crud.update(
        db=db, db_obj=db_notification, obj_in=update_data
    )
    
    return updated_notification


@router.put("/read-all", response_model=dict, tags=["notifications"])
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    تحديد جميع إشعارات المستخدم الحالي كمقروءة
    
    يقوم بتحديث جميع الإشعارات غير المقروءة للمستخدم الحالي إلى حالة "مقروءة"
    
    * يُرجع عدد الإشعارات التي تم تحديثها
    """
    count = mark_all_read(db=db, user_id=current_user.id)
    
    return {
        "success": True,
        "message": f"تم تحديث {count} إشعارات كمقروءة",
        "count": count
    }


@router.delete("/{notification_id}", response_model=dict, tags=["notifications"])
async def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    حذف إشعار
    
    * **notification_id**: معرف الإشعار المراد حذفه
    * يمكن للمستخدم حذف الإشعارات الخاصة به فقط
    * يمكن للمسؤولين حذف أي إشعار
    """
    # التحقق من وجود الإشعار
    db_notification = notification_crud.get(db=db, notification_id=notification_id)
    if not db_notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الإشعار غير موجود"
        )
    
    # التحقق من أن الإشعار ينتمي للمستخدم الحالي
    if db_notification.recipient_id != current_user.id and current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحيات لحذف هذا الإشعار"
        )
    
    # حذف الإشعار
    notification_crud.delete(db=db, notification_id=notification_id)
    
    return {
        "success": True,
        "message": "تم حذف الإشعار بنجاح"
    }


@router.delete("/read", response_model=dict, tags=["notifications"])
async def delete_all_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    حذف جميع الإشعارات المقروءة للمستخدم الحالي
    
    يقوم بحذف جميع الإشعارات التي تم تحديدها كمقروءة
    
    * يبقي جميع الإشعارات غير المقروءة
    * يُرجع عدد الإشعارات التي تم حذفها
    """
    # الحصول على جميع الإشعارات المقروءة للمستخدم
    read_notifications = notification_crud.get_multi(
        db=db, recipient_id=current_user.id, is_read=True
    )
    
    count = 0
    for notification in read_notifications:
        notification_crud.delete(db=db, notification_id=notification.id)
        count += 1
    
    return {
        "success": True,
        "message": f"تم حذف {count} إشعارات مقروءة",
        "count": count
    }


# WebSocket endpoints for real-time notifications
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    نقطة نهاية WebSocket للإشعارات في الوقت الحقيقي
    
    المستخدمون يتصلون باستخدام رمز JWT الخاص بهم:
    ws://example.com/api/v1/notifications/ws/{token}
    
    بمجرد الاتصال، سيتلقى المستخدمون الإشعارات في الوقت الحقيقي على شكل رسائل JSON.
    
    مثال لتنسيق الرسائل المستلمة:
    ```json
    {
        "type": "notification",
        "message": "تم تعيين حالة جديدة لك",
        "related_case_id": "123e4567-e89b-12d3-a456-426614174000"
    }
    ```
    """
    try:
        # التحقق من JWT والحصول على المستخدم
        user = await get_current_user_from_token(token)
        
        # قبول الاتصال وإضافته إلى المدير
        await manager.connect(websocket, user.id)
        
        try:
            # الاستماع للرسائل (يمكن استخدامها للتأكد من أن الاتصال لا يزال نشطًا)
            while True:
                data = await websocket.receive_text()
                # يمكننا معالجة الرسائل الواردة هنا إذا لزم الأمر
                # مثل تحديث حالة "متصل" للمستخدم
        except WebSocketDisconnect:
            # إزالة الاتصال عند الانقطاع
            await manager.disconnect(websocket, user.id)
    except Exception as e:
        # في حالة حدوث خطأ في التحقق من الرمز
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
