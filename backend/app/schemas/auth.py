from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime

from app.schemas.user import User


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime
    refresh_token: str


class TokenPayload(BaseModel):
    sub: UUID4
    exp: datetime


class TokenData(BaseModel):
    user_id: UUID4


class Login(BaseModel):
    username: str
    password: str


class RefreshToken(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    token: Token
    user: User
