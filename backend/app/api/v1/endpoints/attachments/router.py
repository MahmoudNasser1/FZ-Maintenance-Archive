from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.attachment import Attachment, AttachmentType
from app.schemas.attachment import AttachmentCreate, AttachmentUpdate, Attachment as AttachmentSchema, AttachmentWithUser
from app.services.file_service import save_upload_file

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
    query = db.query(Attachment)
    
    if case_id:
        query = query.filter(Attachment.case_id == case_id)
    
    if file_type:
        query = query.filter(Attachment.file_type == file_type)
    
    attachments = query.order_by(Attachment.created_at.desc()).offset(skip).limit(limit).all()
    return attachments


@router.post("/", response_model=AttachmentSchema)
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
    file_path = await save_upload_file(file)
    
    # Create attachment record
    attachment_in = AttachmentCreate(
        case_id=case_id,
        file_url=file_path,
        file_name=file.filename,
        file_type=file_type,
        file_size=str(file.size),
    )
    
    db_attachment = Attachment(
        case_id=attachment_in.case_id,
        file_url=attachment_in.file_url,
        file_name=attachment_in.file_name,
        file_type=attachment_in.file_type,
        file_size=attachment_in.file_size,
        uploaded_by=current_user.id,
    )
    
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    
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
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )
    return attachment


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
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )
    
    update_data = attachment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attachment, field, value)
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment


@router.delete("/{attachment_id}", response_model=AttachmentSchema)
async def delete_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete attachment.
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )
    
    # Note: In a production system, you would also delete the file from storage
    # delete_file(attachment.file_url)
    
    db.delete(attachment)
    db.commit()
    
    return attachment


@router.get("/by-case/{case_id}", response_model=List[AttachmentWithUser])
async def read_attachments_by_case(
    case_id: UUID,
    file_type: Optional[AttachmentType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get attachments by case ID with optional filtering by file_type.
    """
    query = db.query(Attachment).filter(Attachment.case_id == case_id)
    
    if file_type:
        query = query.filter(Attachment.file_type == file_type)
    
    attachments = query.order_by(Attachment.created_at.desc()).all()
    return attachments
