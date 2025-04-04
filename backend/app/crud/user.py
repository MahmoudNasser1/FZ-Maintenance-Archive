from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser:
    def get(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID
        """
        return db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        """
        Get a user by username
        """
        return db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get a user by email
        """
        return db.query(User).filter(User.email == email).first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100, role: Optional[UserRole] = None
    ) -> List[User]:
        """
        Get multiple users with pagination
        """
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Create a new user
        """
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            full_name=obj_in.full_name,
            hashed_password=get_password_hash(obj_in.password),
            role=obj_in.role,
            is_active=obj_in.is_active,
            profile_image=obj_in.profile_image
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """
        Update a user
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, user_id: UUID) -> User:
        """
        Delete a user
        """
        obj = db.query(User).get(user_id)
        db.delete(obj)
        db.commit()
        return obj
    
    def authenticate(
        self, db: Session, *, username: str, password: str
    ) -> Optional[User]:
        """
        Authenticate a user
        """
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def is_active(self, user: User) -> bool:
        """
        Check if user is active
        """
        return user.is_active
    
    def is_admin(self, user: User) -> bool:
        """
        Check if user is admin
        """
        return user.role == UserRole.ADMIN
    
    def is_manager(self, user: User) -> bool:
        """
        Check if user is manager
        """
        return user.role == UserRole.MANAGER
    
    def update_points(self, db: Session, *, user_id: UUID, points: int) -> User:
        """
        Update user points
        """
        user = self.get(db, user_id=user_id)
        if not user:
            return None
        user.points += points
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user = CRUDUser()
