"""
Authentication utilities
"""
from sqlalchemy.orm import Session
from . import models, services, schemas
from utils.usn_utils import USNValidator, validate_user_id, parse_usn


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
            "user_id": "EMP002",  # Employee ID for professor
            "password": "prof123",
            "full_name": "Professor Johnson",
            "email": "johnson@classroom.com",
            "role": "professor"
        },
        {
            "user_id": "4KV22CS001",  # USN for student
            "password": "student123",
            "full_name": "John Doe",
            "email": "john@classroom.com",
            "role": "student"
        },
        {
            "user_id": "4KV22CS002",  # USN for student
            "password": "student123",
            "full_name": "Jane Smith",
            "email": "jane@classroom.com",
            "role": "student"
        },
        {
            "user_id": "4KV22ME001",  # USN for student
            "password": "student123",
            "full_name": "Mike Johnson",
            "email": "mike@classroom.com",
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


def validate_usn_format(usn: str) -> bool:
    """Validate USN format using USNValidator"""
    return USNValidator.validate_usn(usn)


def validate_user_id_format(user_id: str) -> tuple[bool, str]:
    """Validate user ID format and return role"""
    return validate_user_id(user_id)


def extract_usn_info(usn: str) -> dict:
    """Extract information from USN"""
    return parse_usn(usn) or {}


def generate_user_data_from_usn(usn: str) -> dict:
    """Generate additional user data from USN"""
    parsed = parse_usn(usn)
    if not parsed:
        return {}
    
    return {
        "student_usn": usn,
        "department_code": parsed.get("department_code"),
        "institution_code": parsed.get("institution_code"),
        "joined_year": parsed.get("joined_year")
    }