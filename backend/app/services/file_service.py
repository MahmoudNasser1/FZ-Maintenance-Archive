import os
import uuid
from fastapi import UploadFile
from pathlib import Path

from app.core.config import settings


async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save an uploaded file to the uploads directory
    
    Args:
        upload_file: The uploaded file
        
    Returns:
        Path to the saved file (relative to the upload directory)
    """
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIRECTORY)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create subdirectory based on file type
    file_type_dir = ""
    if file_extension.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
        file_type_dir = "images"
    elif file_extension.lower() in ['.pdf', '.doc', '.docx', '.txt']:
        file_type_dir = "documents"
    elif file_extension.lower() in ['.mp3', '.wav', '.ogg']:
        file_type_dir = "audio"
    elif file_extension.lower() in ['.mp4', '.avi', '.mov', '.wmv']:
        file_type_dir = "videos"
    else:
        file_type_dir = "other"
    
    type_dir = upload_dir / file_type_dir
    type_dir.mkdir(exist_ok=True)
    
    # Save file
    file_path = type_dir / unique_filename
    file_content = await upload_file.read()
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Return relative path
    return f"{file_type_dir}/{unique_filename}"


def delete_file(file_path: str) -> bool:
    """
    Delete a file from the uploads directory
    
    Args:
        file_path: Relative path to the file
        
    Returns:
        True if file was deleted, False otherwise
    """
    try:
        full_path = Path(settings.UPLOAD_DIRECTORY) / file_path
        if full_path.exists():
            full_path.unlink()
            return True
    except Exception:
        pass
    
    return False
