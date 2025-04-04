from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps.auth import get_current_active_user, get_current_manager_or_admin_user
from app.models.user import User
from app.models.case import CaseStatus
from app.schemas.case import CaseUpdate
from app.services.activity_service import create_activity
from app.crud.case import case

router = APIRouter()


class BatchUpdateStatus(BaseModel):
    """Schema for batch status update"""
    case_ids: List[UUID]
    status: CaseStatus
    notes: Optional[str] = None


class BatchAssignTechnician(BaseModel):
    """Schema for batch technician assignment"""
    case_ids: List[UUID]
    technician_id: UUID
    notes: Optional[str] = None


class BatchUpdateResponse(BaseModel):
    """Response schema for batch operations"""
    updated_count: int
    success: bool
    failed_ids: Optional[List[UUID]] = None
    message: str


@router.post("/status", response_model=BatchUpdateResponse)
async def batch_update_status(
    update_data: BatchUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    تحديث حالة مجموعة من حالات الصيانة دفعة واحدة.
    
    تتطلب صلاحية مدير أو مسؤول.
    
    المعلمات:
    - case_ids: قائمة معرفات الحالات المراد تحديثها
    - status: الحالة الجديدة
    - notes: ملاحظات اختيارية حول التحديث
    """
    success_count = 0
    failed_ids = []
    
    for case_id in update_data.case_ids:
        try:
            # الحصول على الحالة
            db_case = case.get(db=db, case_id=case_id)
            if not db_case:
                failed_ids.append(case_id)
                continue
                
            # تحديث الحالة
            case_update = CaseUpdate(status=update_data.status)
            case.update(db=db, db_obj=db_case, obj_in=case_update)
            
            # إنشاء سجل نشاط
            activity_desc = f"تم تغيير حالة القضية إلى {update_data.status.value}"
            if update_data.notes:
                activity_desc += f" - ملاحظات: {update_data.notes}"
                
            create_activity(
                db=db,
                case_id=case_id,
                performed_by=current_user.id,
                action=activity_desc
            )
            
            success_count += 1
        except Exception as e:
            failed_ids.append(case_id)
    
    message = f"تم تحديث {success_count} حالة بنجاح"
    if failed_ids:
        message += f" مع فشل {len(failed_ids)} حالة"
    
    return BatchUpdateResponse(
        updated_count=success_count,
        success=len(failed_ids) == 0,
        failed_ids=failed_ids if failed_ids else None,
        message=message
    )


@router.post("/assign", response_model=BatchUpdateResponse)
async def batch_assign_technician(
    assign_data: BatchAssignTechnician,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    تعيين فني لمجموعة من حالات الصيانة دفعة واحدة.
    
    تتطلب صلاحية مدير أو مسؤول.
    
    المعلمات:
    - case_ids: قائمة معرفات الحالات المراد تعيين فني لها
    - technician_id: معرف الفني المراد تعيينه
    - notes: ملاحظات اختيارية حول التعيين
    """
    success_count = 0
    failed_ids = []
    
    # التحقق من وجود الفني
    technician = db.query(User).filter(User.id == assign_data.technician_id).first()
    if not technician or technician.role != "technician":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الفني المحدد غير موجود أو ليس لديه دور فني"
        )
    
    for case_id in assign_data.case_ids:
        try:
            # الحصول على الحالة
            db_case = case.get(db=db, case_id=case_id)
            if not db_case:
                failed_ids.append(case_id)
                continue
                
            # تعيين الفني
            case_update = CaseUpdate(technician_id=assign_data.technician_id)
            case.update(db=db, db_obj=db_case, obj_in=case_update)
            
            # إنشاء سجل نشاط
            activity_desc = f"تم تعيين الفني {technician.full_name} للقضية"
            if assign_data.notes:
                activity_desc += f" - ملاحظات: {assign_data.notes}"
                
            create_activity(
                db=db,
                case_id=case_id,
                performed_by=current_user.id,
                action=activity_desc
            )
            
            success_count += 1
        except Exception as e:
            failed_ids.append(case_id)
    
    message = f"تم تعيين فني لـ {success_count} حالة بنجاح"
    if failed_ids:
        message += f" مع فشل {len(failed_ids)} حالة"
    
    return BatchUpdateResponse(
        updated_count=success_count,
        success=len(failed_ids) == 0,
        failed_ids=failed_ids if failed_ids else None,
        message=message
    )


@router.delete("/", response_model=BatchUpdateResponse)
async def batch_delete_cases(
    case_ids: List[UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin_user),
):
    """
    حذف مجموعة من حالات الصيانة دفعة واحدة.
    
    تتطلب صلاحية مدير أو مسؤول.
    
    المعلمات:
    - case_ids: قائمة معرفات الحالات المراد حذفها
    """
    success_count = 0
    failed_ids = []
    
    for case_id in case_ids:
        try:
            # التحقق من وجود الحالة
            db_case = case.get(db=db, case_id=case_id)
            if not db_case:
                failed_ids.append(case_id)
                continue
                
            # حذف الحالة
            case.delete(db=db, case_id=case_id)
            success_count += 1
        except Exception as e:
            failed_ids.append(case_id)
    
    message = f"تم حذف {success_count} حالة بنجاح"
    if failed_ids:
        message += f" مع فشل {len(failed_ids)} حالة"
    
    return BatchUpdateResponse(
        updated_count=success_count,
        success=len(failed_ids) == 0,
        failed_ids=failed_ids if failed_ids else None,
        message=message
    )
