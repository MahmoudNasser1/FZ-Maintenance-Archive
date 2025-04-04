from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import Token, Login, RefreshToken, LoginResponse
from app.schemas.user import UserCreate, User as UserSchema
from app.crud.user import user

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(login_data: Login, db: Session = Depends(get_db)):
    """
    Login with username and password
    """
    user_obj = db.query(User).filter(User.username == login_data.username).first()
    if not user_obj or not verify_password(login_data.password, user_obj.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user_obj.id, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(subject=user_obj.id)
    
    token = Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=datetime.utcnow() + access_token_expires,
        refresh_token=refresh_token
    )
    
    return LoginResponse(token=token, user=user_obj)


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshToken, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = jwt.decode(
            refresh_data.refresh_token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # Validate token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user ID
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user
        user_obj = user.get(db, user_id=user_id)
        if not user_obj or not user_obj.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(subject=user_obj.id, expires_delta=access_token_expires)
        refresh_token = create_refresh_token(subject=user_obj.id)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_at=datetime.utcnow() + access_token_expires,
            refresh_token=refresh_token
        )
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=UserSchema)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check if username or email already exists
    if user.get_by_username(db, username=user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    if user.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    new_user = user.create(db, obj_in=user_in)
    return new_user
