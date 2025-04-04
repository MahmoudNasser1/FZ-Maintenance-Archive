import pytest
from uuid import uuid4
from sqlalchemy.orm import Session

from app.crud.notification import notification as notification_crud
from app.schemas.notification import NotificationCreate, NotificationUpdate
from app.models.notification import Notification


def test_create_notification(db_session: Session, test_user):
    """اختبار إنشاء إشعار جديد"""
    message = "هذا إشعار اختبار"
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message=message,
        is_read=False
    )
    
    # إنشاء الإشعار
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # التحقق من خصائص الإشعار
    assert notification.message == message
    assert notification.recipient_id == test_user.id
    assert notification.is_read is False
    assert notification.id is not None


def test_get_notification(db_session: Session, test_user):
    """اختبار استرجاع إشعار بواسطة المعرف"""
    # إنشاء إشعار جديد للاختبار
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار للاختبار",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # استرجاع الإشعار واختباره
    fetched_notification = notification_crud.get(db=db_session, notification_id=notification.id)
    assert fetched_notification
    assert fetched_notification.id == notification.id
    assert fetched_notification.message == "إشعار للاختبار"


def test_get_multi_notification(db_session: Session, test_user):
    """اختبار استرجاع عدة إشعارات مع تطبيق الفلاتر"""
    # إنشاء عدة إشعارات للاختبار
    for i in range(5):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار رقم {i}",
            is_read=i % 2 == 0  # بعضها مقروء وبعضها غير مقروء
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # استرجاع الإشعارات غير المقروءة
    unread_notifications = notification_crud.get_multi(
        db=db_session, recipient_id=test_user.id, is_read=False
    )
    assert len(unread_notifications) > 0
    for notification in unread_notifications:
        assert notification.is_read is False
    
    # استرجاع الإشعارات المقروءة
    read_notifications = notification_crud.get_multi(
        db=db_session, recipient_id=test_user.id, is_read=True
    )
    assert len(read_notifications) > 0
    for notification in read_notifications:
        assert notification.is_read is True


def test_update_notification(db_session: Session, test_user):
    """اختبار تحديث إشعار"""
    # إنشاء إشعار جديد للاختبار
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار قبل التحديث",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # تحديث الإشعار
    notification_update = NotificationUpdate(is_read=True)
    updated_notification = notification_crud.update(
        db=db_session, db_obj=notification, obj_in=notification_update
    )
    
    # التحقق من التحديث
    assert updated_notification.is_read is True
    assert updated_notification.message == "إشعار قبل التحديث"  # لم يتغير
    assert updated_notification.id == notification.id


def test_delete_notification(db_session: Session, test_user):
    """اختبار حذف إشعار"""
    # إنشاء إشعار جديد للاختبار
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار سيتم حذفه",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # التأكد من وجود الإشعار
    fetched_notification = notification_crud.get(db=db_session, notification_id=notification.id)
    assert fetched_notification is not None
    
    # حذف الإشعار
    notification_crud.delete(db=db_session, notification_id=notification.id)
    
    # التأكد من عدم وجود الإشعار بعد الحذف
    deleted_notification = notification_crud.get(db=db_session, notification_id=notification.id)
    assert deleted_notification is None


def test_mark_as_read(db_session: Session, test_user):
    """اختبار تحديد إشعار كمقروء"""
    # إنشاء إشعار جديد غير مقروء
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار غير مقروء",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    assert notification.is_read is False
    
    # تحديد الإشعار كمقروء
    updated_notification = notification_crud.mark_as_read(db=db_session, notification_id=notification.id)
    assert updated_notification.is_read is True


def test_mark_all_as_read(db_session: Session, test_user):
    """اختبار تحديد جميع إشعارات المستخدم كمقروءة"""
    # إنشاء عدة إشعارات غير مقروءة
    for i in range(3):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار غير مقروء {i}",
            is_read=False
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # التأكد من وجود إشعارات غير مقروءة
    unread_count_before = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert unread_count_before > 0
    
    # تحديد جميع الإشعارات كمقروءة
    updated_count = notification_crud.mark_all_as_read(db=db_session, recipient_id=test_user.id)
    assert updated_count > 0
    
    # التأكد من عدم وجود إشعارات غير مقروءة
    unread_count_after = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert unread_count_after == 0


def test_get_unread_count(db_session: Session, test_user):
    """اختبار الحصول على عدد الإشعارات غير المقروءة"""
    # حذف جميع الإشعارات السابقة (إن وجدت)
    notifications = db_session.query(Notification).filter(Notification.recipient_id == test_user.id).all()
    for notification in notifications:
        db_session.delete(notification)
    db_session.commit()
    
    # التأكد من عدم وجود إشعارات
    count = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert count == 0
    
    # إنشاء 3 إشعارات غير مقروءة
    for i in range(3):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار غير مقروء {i}",
            is_read=False
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # التحقق من العدد
    count = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert count == 3
