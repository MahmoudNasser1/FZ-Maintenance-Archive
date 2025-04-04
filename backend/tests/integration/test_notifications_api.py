import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification
from app.crud.notification import notification as notification_crud
from app.schemas.notification import NotificationCreate


def test_read_notifications(client, user_token_headers, db_session, test_user):
    """اختبار استرجاع إشعارات المستخدم"""
    # إنشاء بعض الإشعارات للاختبار
    for i in range(3):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار اختبار رقم {i}",
            is_read=(i % 2 == 0)  # بعضها مقروء وبعضها غير مقروء
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إرسال طلب للحصول على جميع الإشعارات
    response = client.get(
        f"{settings.API_V1_STR}/notifications/",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) >= 3
    
    # التحقق من تنسيق البيانات
    for notification in notifications:
        assert "id" in notification
        assert "message" in notification
        assert "is_read" in notification
        assert "created_at" in notification


def test_read_unread_notifications(client, user_token_headers, db_session, test_user):
    """اختبار استرجاع الإشعارات غير المقروءة فقط"""
    # إنشاء بعض الإشعارات للاختبار
    for i in range(5):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار اختبار رقم {i}",
            is_read=(i % 2 == 0)  # بعضها مقروء وبعضها غير مقروء
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إرسال طلب للحصول على الإشعارات غير المقروءة فقط
    response = client.get(
        f"{settings.API_V1_STR}/notifications/?is_read=false",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) > 0
    
    # التأكد من أن جميع الإشعارات غير مقروءة
    for notification in notifications:
        assert notification["is_read"] is False


def test_read_notification_count(client, user_token_headers, db_session, test_user):
    """اختبار الحصول على عدد الإشعارات غير المقروءة"""
    # حذف جميع الإشعارات السابقة (إن وجدت)
    db_session.query(Notification).filter(Notification.recipient_id == test_user.id).delete()
    db_session.commit()
    
    # إنشاء عدد محدد من الإشعارات غير المقروءة
    unread_count = 3
    for i in range(unread_count):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار غير مقروء {i}",
            is_read=False
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إنشاء إشعارات مقروءة أيضًا
    for i in range(2):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار مقروء {i}",
            is_read=True
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إرسال طلب للحصول على عدد الإشعارات غير المقروءة
    response = client.get(
        f"{settings.API_V1_STR}/notifications/count",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    count = response.json()
    assert count == unread_count


def test_create_notification(client, admin_token_headers, db_session, test_user):
    """اختبار إنشاء إشعار جديد (مطلوب صلاحيات المسؤول)"""
    # بيانات الإشعار الجديد
    notification_data = {
        "recipient_id": str(test_user.id),
        "message": "إشعار اختبار من المسؤول",
        "is_read": False
    }
    
    # إرسال طلب لإنشاء إشعار جديد
    response = client.post(
        f"{settings.API_V1_STR}/notifications/",
        headers=admin_token_headers,
        json=notification_data
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 201
    new_notification = response.json()
    assert new_notification["message"] == notification_data["message"]
    assert new_notification["recipient_id"] == notification_data["recipient_id"]
    assert new_notification["is_read"] == notification_data["is_read"]
    assert "id" in new_notification
    assert "created_at" in new_notification


def test_mark_notification_as_read(client, user_token_headers, db_session, test_user):
    """اختبار تحديد إشعار كمقروء"""
    # إنشاء إشعار غير مقروء للاختبار
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار غير مقروء للاختبار",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إرسال طلب لتحديد الإشعار كمقروء
    response = client.put(
        f"{settings.API_V1_STR}/notifications/{notification.id}/read",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    updated_notification = response.json()
    assert updated_notification["is_read"] is True


def test_mark_all_notifications_as_read(client, user_token_headers, db_session, test_user):
    """اختبار تحديد جميع الإشعارات كمقروءة"""
    # إنشاء عدة إشعارات غير مقروءة للاختبار
    for i in range(3):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار غير مقروء للاختبار {i}",
            is_read=False
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # التأكد من وجود إشعارات غير مقروءة
    unread_count = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert unread_count > 0
    
    # إرسال طلب لتحديد جميع الإشعارات كمقروءة
    response = client.put(
        f"{settings.API_V1_STR}/notifications/read-all",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["count"] > 0
    
    # التأكد من عدم وجود إشعارات غير مقروءة
    unread_count = notification_crud.get_unread_count(db=db_session, recipient_id=test_user.id)
    assert unread_count == 0


def test_delete_notification(client, user_token_headers, db_session, test_user):
    """اختبار حذف إشعار"""
    # إنشاء إشعار للاختبار
    notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار للحذف",
        is_read=False
    )
    notification = notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إرسال طلب لحذف الإشعار
    response = client.delete(
        f"{settings.API_V1_STR}/notifications/{notification.id}",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    
    # التأكد من عدم وجود الإشعار بعد الحذف
    deleted_notification = notification_crud.get(db=db_session, notification_id=notification.id)
    assert deleted_notification is None


def test_delete_all_read_notifications(client, user_token_headers, db_session, test_user):
    """اختبار حذف جميع الإشعارات المقروءة"""
    # حذف جميع الإشعارات السابقة (إن وجدت)
    db_session.query(Notification).filter(Notification.recipient_id == test_user.id).delete()
    db_session.commit()
    
    # إنشاء إشعارات مقروءة للاختبار
    read_count = 3
    for i in range(read_count):
        notification_in = NotificationCreate(
            recipient_id=test_user.id,
            message=f"إشعار مقروء للحذف {i}",
            is_read=True
        )
        notification_crud.create(db=db_session, obj_in=notification_in)
    
    # إنشاء إشعار غير مقروء (يجب ألا يتم حذفه)
    unread_notification_in = NotificationCreate(
        recipient_id=test_user.id,
        message="إشعار غير مقروء - لا يجب حذفه",
        is_read=False
    )
    notification_crud.create(db=db_session, obj_in=unread_notification_in)
    
    # إرسال طلب لحذف جميع الإشعارات المقروءة
    response = client.delete(
        f"{settings.API_V1_STR}/notifications/read",
        headers=user_token_headers
    )
    
    # التحقق من الاستجابة
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["count"] == read_count
    
    # التأكد من بقاء الإشعار غير المقروء فقط
    remaining_notifications = notification_crud.get_multi(db=db_session, recipient_id=test_user.id)
    assert len(remaining_notifications) == 1
    assert remaining_notifications[0].is_read is False
