#!/usr/bin/env python3
"""
Initialize database tables
"""

from database import engine
from models.class_model import ClassModel
from models.timetable_model import TimetableModel
from models.notification_model import NotificationModel
from models.attendance_model import AttendanceModel

def init_database():
    """Create all database tables"""
    print("🔧 Creating database tables...")
    
    try:
        # Create all tables
        ClassModel.metadata.create_all(bind=engine)
        TimetableModel.metadata.create_all(bind=engine)
        NotificationModel.metadata.create_all(bind=engine)
        AttendanceModel.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("   - Classes table")
        print("   - Timetable table")
        print("   - Notifications table")
        print("   - Attendance table")
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")

if __name__ == "__main__":
    init_database()