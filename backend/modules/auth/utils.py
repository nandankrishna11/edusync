"""
Authentication utilities
"""
from sqlalchemy.orm import Session
from . import models, services, schemas


def create_default_admin(db: Session):
    """Create default admin user if it doesn't exist"""
    admin_user = db.query(models.User).filter(models.User.user_id == "ADMIN001").first()
    
    if not admin_user:
        admin_data = schemas.UserCreate(
            user_id="ADMIN001",
            password="admin123",
            full_name="System Administrator",
            email="admin@classroom.com",
            role="admin"
        )
        
        try:
            admin_user = services.create_user(db, admin_data)
            print(f"Default admin user created: {admin_user.user_id}")
            return admin_user
        except Exception as e:
            print(f"Error creating default admin user: {e}")
            return None
    
    return admin_user


def create_sample_users(db: Session):
    """Create sample users for testing"""
    sample_users = [
        {
            "user_id": "EMP001",  # Employee ID for professor
            "password": "prof123",
            "full_name": "Professor Smith",
            "email": "smith@classroom.com",
            "role": "professor"
        },
        {
            "user_id": "1MS21CS001",  # USN for student
            "password": "student123",
            "full_name": "John Doe",
            "email": "john@classroom.com",
            "role": "student"
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        existing_user = db.query(models.User).filter(
            models.User.user_id == user_data["user_id"]
        ).first()
        
        if not existing_user:
            try:
                user_schema = schemas.UserCreate(**user_data)
                new_user = services.create_user(db, user_schema)
                created_users.append(new_user)
                print(f"Sample user created: {new_user.user_id}")
            except Exception as e:
                print(f"Error creating sample user {user_data['user_id']}: {e}")
    
    return created_users