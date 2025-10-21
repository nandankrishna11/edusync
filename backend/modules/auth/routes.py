"""
Authentication routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from . import schemas, models, services

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    try:
        return services.create_user(db=db, user=user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.post("/login", response_model=schemas.LoginResponse)
def login_user(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with User ID and password"""
    try:
        user = services.authenticate_user(db, login_data.user_id, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid User ID or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        access_token = services.create_access_token(
            data={"sub": user.user_id, "role": user.role}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to server error"
        )


@router.post("/token", response_model=schemas.LoginResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token with role information"""
    # form_data.username will now contain user_id (USN/Employee ID/Admin ID)
    user = services.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect User ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Include role in JWT token
    access_token = services.create_access_token(
        data={"sub": user.user_id, "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(services.get_current_user)
):
    """Get current user info"""
    return current_user


@router.get("/roles")
async def get_available_roles():
    """Get available user roles"""
    return {
        "roles": [
            {"value": "student", "label": "Student"},
            {"value": "professor", "label": "Professor"},
            {"value": "admin", "label": "Administrator"}
        ]
    }


@router.get("/users", response_model=list[schemas.User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(services.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return services.get_users(db, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=schemas.User)
async def get_user(
    user_id: int,
    current_user: models.User = Depends(services.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = services.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(services.get_current_user),
    db: Session = Depends(get_db)
):
    """Update user information"""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Only admin can change roles
    if user_update.role and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can change user roles"
        )
    
    return services.update_user(db, user_id, user_update)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(services.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    return services.delete_user(db, user_id)


@router.post("/verify-token")
async def verify_token(
    current_user: models.User = Depends(services.get_current_user)
):
    """Verify if token is valid"""
    return {"valid": True, "user": current_user}


@router.post("/change-password")
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(services.get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    return services.change_password(
        db, 
        current_user.id, 
        password_data.current_password, 
        password_data.new_password
    )


@router.post("/reset-password")
def reset_password(
    reset_data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using User ID"""
    user = services.get_user_by_user_id(db, reset_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User ID not found")
    
    user.hashed_password = services.get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}