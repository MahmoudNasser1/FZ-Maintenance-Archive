from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.crud.activity import activity
from app.schemas.activity import Activity as ActivitySchema, ActivityWithUser
from app.services.activity_service import get_case_activities, get_recent_activities, get_daily_activity_counts

router = APIRouter()


@router.get("/", response_model=List[ActivityWithUser])
async def read_activities(
    case_id: Optional[UUID] = None,
    performed_by: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    استرجاع سجلات الأنشطة مع إمكانية التصفية حسب مختلف المعايير.
    """
    return activity.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        case_id=case_id,
        performed_by=performed_by,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/{activity_id}", response_model=ActivityWithUser)
async def read_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على نشاط محدد بواسطة المعرف.
    """
    db_activity = activity.get(db=db, activity_id=activity_id)
    if not db_activity:
        raise HTTPException(status_code=404, detail="النشاط غير موجود")
    return db_activity


@router.get("/case/{case_id}", response_model=List[ActivityWithUser])
async def read_activities_by_case(
    case_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على سجلات الأنشطة لحالة معينة.
    """
    return activity.get_multi(
        db=db,
        case_id=case_id,
        skip=skip,
        limit=limit
    )


@router.get("/user/{user_id}", response_model=List[ActivityWithUser])
async def read_activities_by_user(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على سجلات الأنشطة المنفذة بواسطة مستخدم محدد.
    """
    # التحقق من الصلاحيات: فقط المستخدم نفسه أو المدير يمكنه عرض أنشطة المستخدم
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية للوصول إلى سجلات أنشطة هذا المستخدم"
        )
    
    return activity.get_multi(
        db=db,
        performed_by=user_id,
        skip=skip,
        limit=limit
    )


@router.get("/case/{case_id}/summary", response_model=List[ActivityWithUser])
async def get_case_activity_summary(
    case_id: UUID,
    days: int = 7,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على ملخص لأنشطة حالة معينة (مقتصراً على أهم الأنشطة الأخيرة).
    """
    return get_recent_activities(
        db=db,
        case_id=case_id,
        days=days,
        limit=limit
    )


@router.get("/stats/daily", response_model=Dict[str, int])
async def get_activity_stats(
    days: int = 30,
    case_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    الحصول على إحصائيات الأنشطة اليومية.
    """
    return get_daily_activity_counts(
        db=db,
        days=days,
        case_id=case_id
    )
