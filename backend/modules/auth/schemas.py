"""
Authentication schemas
"""
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    user_id: str  # USN for students, Employee ID for professors, Admin ID for admins
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "student"


class UserCreate(BaseModel):
    user_id: str  # USN for students, Employee ID for professors, Admin ID for admins
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str = "student"


class UserUpdate(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    email: str


class LoginRequest(BaseModel):
    user_id: str  # Can be USN, Employee ID, or Admin ID
    password: str


class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str