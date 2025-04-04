import os
import sys
from pathlib import Path

# إضافة المسار الرئيسي للمشروع إلى PYTHON_PATH
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import engine, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.base import Base
from app.core.config import settings
import uuid

# التأكد من إنشاء جميع الجداول
Base.metadata.create_all(bind=engine)

def create_admin_user():
    """إنشاء مستخدم مدير افتراضي"""
    db = next(get_db())
    
    # التحقق من وجود مستخدم مدير بالفعل
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if admin:
        print(f"المسؤول موجود بالفعل: {admin.username}")
        print(f"إذا كنت بحاجة إلى إعادة تعيين كلمة المرور، يمكنك حذف المستخدم وإنشاء واحد جديد")
        return
    
    # إنشاء مستخدم مدير جديد
    admin_user = User(
        id=uuid.uuid4(),
        full_name="مدير النظام",
        username="admin",
        email="admin@fixzone.com",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"تم إنشاء مستخدم مدير جديد:")
    print(f"اسم المستخدم: admin")
    print(f"كلمة المرور: admin123")

if __name__ == "__main__":
    create_admin_user()
