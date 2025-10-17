"""
Authentication utilities
"""
from sqlalchemy.orm import Session
from . import models, services, schemas


def create_default_admin(db: Session):
    """Create default admin user if it doesn't exist"""
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    
    if not admin_user:
        admin_data = schemas.UserCreate(
            username="admin",
            email="admin@classroom.com",
            password="admin123",
            full_name="System Administrator",
            role="admin"
        )
        
        try:
            admin_user = services.create_user(db, admin_data)
            print(f"Default admin user created: {admin_user.username}")
            return admin_user
        except Exception as e:
            print(f"Error creating default admin user: {e}")
            return None
    
    return admin_user


def create_sample_users(db: Session):
    """Create sample users for testing"""
    sample_users = [
        {
            "username": "prof_smith",
            "email": "smith@classroom.com",
            "password": "prof123",
            "full_name": "Professor Smith",
            "role": "professor"
        },
        {
            "username": "student_john",
            "email": "john@classroom.com",
            "password": "student123",
            "full_name": "John Doe",
            "role": "student"
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        existing_user = db.query(models.User).filter(
            models.User.username == user_data["username"]
        ).first()
        
        if not existing_user:
            try:
                user_schema = schemas.UserCreate(**user_data)
                new_user = services.create_user(db, user_schema)
                created_users.append(new_user)
                print(f"Sample user created: {new_user.username}")
            except Exception as e:
                print(f"Error creating sample user {user_data['username']}: {e}")
    
    return created_users