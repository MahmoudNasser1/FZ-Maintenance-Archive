from typing import Optional
from datetime import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import UUID4

from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import TokenData
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get the current user from the database based on the token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=UUID4(user_id))
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_current_user_from_token(token: str) -> User:
    """
    Asynchronous function to get the current user from token for WebSocket connections
    
    This is a special version of get_current_user that doesn't use FastAPI dependency injection,
    allowing it to be used in WebSocket endpoints.
    
    Args:
        token: JWT token

    Returns:
        User: User object if token is valid

    Raises:
        Exception: If token is invalid or user not found
    """
    from app.core.database import SessionLocal
    
    try:
        # Validate JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid authentication credentials")
        token_data = TokenData(user_id=UUID4(user_id))
        
        # Get user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == token_data.user_id).first()
            if user is None:
                raise ValueError("User not found")
            if not user.is_active:
                raise ValueError("Inactive user")
            return user
        finally:
            db.close()
    except JWTError:
        raise ValueError("Invalid authentication token")
    except Exception as e:
        raise ValueError(f"Authentication error: {str(e)}")


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active admin user
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
