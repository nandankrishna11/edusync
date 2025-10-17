"""
Authentication dependencies for role-based access control
"""
from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from . import models, services


def get_current_active_user(
    current_user: models.User = Depends(services.get_current_user)
):
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_roles(allowed_roles: List[str]):
    """Dependency factory to require specific roles"""
    def role_checker(
        current_user: models.User = Depends(get_current_active_user)
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_admin(
    current_user: models.User = Depends(get_current_active_user)
):
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_professor_or_admin(
    current_user: models.User = Depends(get_current_active_user)
):
    """Require professor or admin role"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor or admin access required"
        )
    return current_user


def require_permission(permission: str):
    """Dependency factory to require specific permission"""
    def permission_checker(
        current_user: models.User = Depends(get_current_active_user)
    ):
        if not services.has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_checker