from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.auth import get_current_active_user, get_current_active_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Retrieve users. Admin only.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserSchema)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Create new user. Admin only.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this username already exists",
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=user_in.is_active,
        role=user_in.role,
        profile_image=user_in.profile_image
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/me", response_model=UserSchema)
async def read_user_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update current user.
    """
    if user_in.username and user_in.username != current_user.username:
        user = db.query(User).filter(User.username == user_in.username).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="A user with this username already exists",
            )
    
    if user_in.email and user_in.email != current_user.email:
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists",
            )
    
    update_data = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        update_data["hashed_password"] = get_password_hash(user_in.password)
        update_data.pop("password", None)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get user by ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Update user. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    update_data = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        update_data["hashed_password"] = get_password_hash(user_in.password)
        update_data.pop("password", None)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
