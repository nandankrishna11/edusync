"""
Authentication services
"""
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.config import settings
from database import get_db
from . import models, schemas

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Role-based permissions
ROLE_PERMISSIONS = {
    "admin": ["*"],  # Admin has all permissions
    "professor": [
        "read_classes", "create_classes", "update_classes", "delete_classes",
        "read_timetable", "create_timetable", "update_timetable", "delete_timetable",
        "read_attendance", "create_attendance", "update_attendance",
        "read_notifications", "create_notifications", "update_notifications", "delete_notifications",
        "read_analytics", "read_students"
    ],
    "student": [
        "read_classes", "read_timetable", "read_attendance", "read_notifications",
        "update_profile"
    ]
}


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def create_user(db: Session, user: schemas.UserCreate):
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_id(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Update user information"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    """Delete user"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


def change_password(db: Session, user_id: int, current_password: str, new_password: str):
    """Change user password"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not verify_password(current_password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(db_user)
    return {"message": "Password changed successfully"}


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user from JWT token with role information"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


def has_permission(user: models.User, permission: str) -> bool:
    """Check if user has specific permission"""
    user_permissions = ROLE_PERMISSIONS.get(user.role, [])
    return "*" in user_permissions or permission in user_permissions


