"""
Initialize authentication system with default users
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from modules.auth.models import User
from modules.auth.utils import create_default_admin, create_sample_users


def init_auth_system():
    """Initialize authentication system"""
    # Drop and recreate tables to ensure schema is updated
    User.metadata.drop_all(bind=engine)
    User.metadata.create_all(bind=engine)
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Create default admin user
        admin_user = create_default_admin(db)
        if admin_user:
            print("✓ Default admin user ready")
        
        # Create sample users
        sample_users = create_sample_users(db)
        if sample_users:
            print(f"✓ Created {len(sample_users)} sample users")
        
        print("\n🎉 Authentication system initialized successfully!")
        print("\nDefault credentials (User ID / Password):")
        print("Admin: ADMIN001 / admin123")
        print("Professor: EMP001 / prof123")
        print("Student: 1MS21CS001 / student123")
        print("\nNote: Use these User IDs for login (USN for students, Employee ID for professors, Admin ID for admins)")
        
    except Exception as e:
        print(f"❌ Error initializing auth system: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_auth_system()