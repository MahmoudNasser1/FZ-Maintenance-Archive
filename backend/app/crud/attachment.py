from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.attachment import Attachment, AttachmentType
from app.schemas.attachment import AttachmentCreate, AttachmentUpdate


class CRUDAttachment:
    def get(self, db: Session, attachment_id: UUID) -> Optional[Attachment]:
        """
        Get an attachment by ID
        """
        return db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        case_id: Optional[UUID] = None,
        file_type: Optional[AttachmentType] = None,
        uploaded_by: Optional[UUID] = None
    ) -> List[Attachment]:
        """
        Get multiple attachments with filtering and pagination
        """
        query = db.query(Attachment)
        
        # Apply filters
        if case_id:
            query = query.filter(Attachment.case_id == case_id)
        
        if file_type:
            query = query.filter(Attachment.file_type == file_type)
        
        if uploaded_by:
            query = query.filter(Attachment.uploaded_by == uploaded_by)
        
        # Apply sorting (newest first)
        query = query.order_by(Attachment.created_at.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: AttachmentCreate, uploaded_by: UUID) -> Attachment:
        """
        Create a new attachment
        """
        db_obj = Attachment(
            case_id=obj_in.case_id,
            file_url=obj_in.file_url,
            file_name=obj_in.file_name,
            file_type=obj_in.file_type,
            file_size=obj_in.file_size,
            uploaded_by=uploaded_by
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: Attachment, obj_in: Union[AttachmentUpdate, Dict[str, Any]]
    ) -> Attachment:
        """
        Update an attachment
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, attachment_id: UUID) -> Attachment:
        """
        Delete an attachment
        """
        obj = db.query(Attachment).get(attachment_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_count_by_case(self, db: Session, case_id: UUID) -> int:
        """
        Get count of attachments for a case
        """
        return db.query(Attachment).filter(Attachment.case_id == case_id).count()
    
    def get_type_counts(self, db: Session, case_id: UUID) -> Dict[str, int]:
        """
        Get counts of attachments by type for a case
        """
        result = db.query(
            Attachment.file_type, 
            db.func.count(Attachment.id)
        ).filter(
            Attachment.case_id == case_id
        ).group_by(
            Attachment.file_type
        ).all()
        
        # Initialize with all types set to 0
        counts = {file_type.value: 0 for file_type in AttachmentType}
        
        # Update with actual counts
        for file_type, count in result:
            counts[file_type.value] = count
        
        return counts


attachment = CRUDAttachment()
