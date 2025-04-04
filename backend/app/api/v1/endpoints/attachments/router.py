from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.attachment import AttachmentType
from app.crud.attachment import attachment
from app.schemas.attachment import AttachmentCreate, AttachmentUpdate, Attachment as AttachmentSchema, AttachmentWithUser
from app.services.file_service import save_upload_file
from app.services.activity_service import create_activity

router = APIRouter()


@router.get("/", response_model=List[AttachmentWithUser])
async def read_attachments(
    case_id: Optional[UUID] = None,
    file_type: Optional[AttachmentType] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve attachments with optional filtering by case_id and file_type.
    """
    return attachment.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        case_id=case_id,
        file_type=file_type
    )


@router.post("/", response_model=AttachmentSchema, status_code=status.HTTP_201_CREATED)
async def create_attachment(
    file: UploadFile = File(...),
    case_id: UUID = Form(...),
    file_type: AttachmentType = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new attachment by uploading a file.
    """
    # Save uploaded file
    file_path = f"attachments/{file_type.value}/{case_id}"
    file_url = await save_upload_file(file, file_path)
    
    # Get file size in KB or MB
    file_size = None
    if hasattr(file, "size"):
        size_bytes = file.size
        if size_bytes < 1024 * 1024:  # Less than 1MB
            file_size = f"{size_bytes / 1024:.1f} KB"
        else:
            file_size = f"{size_bytes / (1024 * 1024):.1f} MB"
    
    # Create attachment object
    attachment_in = AttachmentCreate(
        case_id=case_id,
        file_name=file.filename,
        file_type=file_type,
        file_url=file_url,
        file_size=file_size
    )
    
    # Save to database
    db_attachment = attachment.create(
        db=db,
        obj_in=attachment_in,
        uploaded_by=current_user.id
    )
    
    # Log activity
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=f"قام برفع ملف جديد: {file.filename}"
    )
    
    return db_attachment


@router.get("/{attachment_id}", response_model=AttachmentWithUser)
async def read_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get attachment by ID.
    """
    db_attachment = attachment.get(db=db, attachment_id=attachment_id)
    if not db_attachment:
        raise HTTPException(status_code=404, detail="المرفق غير موجود")
    return db_attachment


@router.put("/{attachment_id}", response_model=AttachmentSchema)
async def update_attachment(
    attachment_id: UUID,
    attachment_in: AttachmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update attachment metadata (not the file itself).
    """
    db_attachment = attachment.get(db=db, attachment_id=attachment_id)
    if not db_attachment:
        raise HTTPException(status_code=404, detail="المرفق غير موجود")
    
    # Check permissions (only uploader or admin can update)
    if db_attachment.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية لتعديل هذا المرفق"
        )
    
    db_attachment = attachment.update(
        db=db,
        db_obj=db_attachment,
        obj_in=attachment_in
    )
    
    # Log activity
    create_activity(
        db=db,
        case_id=db_attachment.case_id,
        performed_by=current_user.id,
        action=f"قام بتحديث بيانات المرفق: {db_attachment.file_name}"
    )
    
    return db_attachment


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete attachment.
    """
    db_attachment = attachment.get(db=db, attachment_id=attachment_id)
    if not db_attachment:
        raise HTTPException(status_code=404, detail="المرفق غير موجود")
    
    # Check permissions (only uploader or admin can delete)
    if db_attachment.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية لحذف هذا المرفق"
        )
    
    # Store case_id and filename before deletion for activity log
    case_id = db_attachment.case_id
    file_name = db_attachment.file_name
    
    # Delete from database
    attachment.delete(db=db, attachment_id=attachment_id)
    
    # TODO: Delete the actual file from storage
    
    # Log activity
    create_activity(
        db=db,
        case_id=case_id,
        performed_by=current_user.id,
        action=f"قام بحذف المرفق: {file_name}"
    )
    
    return None


@router.get("/case/{case_id}", response_model=List[AttachmentWithUser])
async def read_attachments_by_case(
    case_id: UUID,
    file_type: Optional[AttachmentType] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get attachments by case ID with optional filtering by file_type.
    """
    return attachment.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        case_id=case_id,
        file_type=file_type
    )
