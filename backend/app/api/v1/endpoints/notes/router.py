from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, Note as NoteSchema, NoteWithUser
from app.services.file_service import save_upload_file

router = APIRouter()


@router.get("/", response_model=List[NoteWithUser])
async def read_notes(
    case_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve notes with optional filtering by case_id.
    """
    query = db.query(Note)
    
    if case_id:
        query = query.filter(Note.case_id == case_id)
    
    notes = query.order_by(Note.created_at.desc()).offset(skip).limit(limit).all()
    return notes


@router.post("/", response_model=NoteSchema)
async def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new note.
    """
    db_note = Note(
        case_id=note_in.case_id,
        note_text=note_in.note_text,
        voice_note_url=note_in.voice_note_url,
        created_by=current_user.id,
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note


@router.post("/with-audio", response_model=NoteSchema)
async def create_note_with_audio(
    case_id: UUID = Form(...),
    note_text: str = Form(...),
    voice_note: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new note with optional audio attachment.
    """
    voice_note_url = None
    if voice_note:
        voice_note_url = await save_upload_file(voice_note)
    
    db_note = Note(
        case_id=case_id,
        note_text=note_text,
        voice_note_url=voice_note_url,
        created_by=current_user.id,
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note


@router.get("/{note_id}", response_model=NoteWithUser)
async def read_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get note by ID.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )
    return note


@router.put("/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: UUID,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update note.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )
    
    # Check if the user is the creator of the note
    if note.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this note",
        )
    
    update_data = note_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return note


@router.delete("/{note_id}", response_model=NoteSchema)
async def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete note.
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )
    
    # Check if the user is the creator of the note
    if note.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this note",
        )
    
    # If there's a voice note, delete it (in production)
    # if note.voice_note_url:
    #     delete_file(note.voice_note_url)
    
    db.delete(note)
    db.commit()
    
    return note


@router.get("/by-case/{case_id}", response_model=List[NoteWithUser])
async def read_notes_by_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get notes by case ID.
    """
    notes = db.query(Note).filter(Note.case_id == case_id).order_by(Note.created_at.desc()).all()
    return notes
