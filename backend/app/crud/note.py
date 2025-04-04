from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


class CRUDNote:
    def get(self, db: Session, note_id: UUID) -> Optional[Note]:
        """
        Get a note by ID
        """
        return db.query(Note).filter(Note.id == note_id).first()
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        case_id: Optional[UUID] = None,
        created_by: Optional[UUID] = None
    ) -> List[Note]:
        """
        Get multiple notes with filtering and pagination
        """
        query = db.query(Note)
        
        # Apply filters
        if case_id:
            query = query.filter(Note.case_id == case_id)
        
        if created_by:
            query = query.filter(Note.created_by == created_by)
        
        # Apply sorting (newest first)
        query = query.order_by(Note.created_at.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: NoteCreate, created_by: UUID) -> Note:
        """
        Create a new note
        """
        db_obj = Note(
            case_id=obj_in.case_id,
            note_text=obj_in.note_text,
            voice_note_url=obj_in.voice_note_url,
            created_by=created_by
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: Note, obj_in: Union[NoteUpdate, Dict[str, Any]]
    ) -> Note:
        """
        Update a note
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
    
    def delete(self, db: Session, *, note_id: UUID) -> Note:
        """
        Delete a note
        """
        obj = db.query(Note).get(note_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def get_count_by_case(self, db: Session, case_id: UUID) -> int:
        """
        Get count of notes for a case
        """
        return db.query(Note).filter(Note.case_id == case_id).count()


note = CRUDNote()
