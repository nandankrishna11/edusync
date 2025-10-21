"""
Initialize attendance with sample data
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.attendance_model import AttendanceModel
from datetime import date, timedelta

def create_sample_attendance():
    """Create sample attendance entries"""
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Sample attendance data for the past week
        today = date.today()
        sample_entries = []
        
        # Create attendance for the past 5 days
        for i in range(5):
            attendance_date = today - timedelta(days=i)
            
            # Morning classes
            sample_entries.extend([
                {
                    "class_id": "1MS21CS",
                    "usn": "1MS21CS001",
                    "date": attendance_date,
                    "status": "present" if i % 3 != 0 else "absent",
                    "marked_by": "EMP001",
                    "subject": "Data Structures",
                    "period_start": "09:00",
                    "period_end": "10:00"
                },
                {
                    "class_id": "1MS21CS",
                    "usn": "1MS21CS001",
                    "date": attendance_date,
                    "status": "present" if i % 2 != 0 else "absent",
                    "marked_by": "EMP001",
                    "subject": "Mathematics",
                    "period_start": "10:00",
                    "period_end": "11:00"
                }
            ])
        
        created_count = 0
        for entry_data in sample_entries:
            # Check if entry already exists
            existing_entry = db.query(AttendanceModel).filter(
                AttendanceModel.class_id == entry_data["class_id"],
                AttendanceModel.usn == entry_data["usn"],
                AttendanceModel.date == entry_data["date"],
                AttendanceModel.subject == entry_data["subject"]
            ).first()
            
            if not existing_entry:
                attendance_entry = AttendanceModel(**entry_data)
                db.add(attendance_entry)
                created_count += 1
        
        db.commit()
        print(f"✓ Created {created_count} attendance entries")
        print("\n🎉 Sample attendance data initialized successfully!")
        print("\nSample attendance includes:")
        print("- Student: 1MS21CS001")
        print("- Class: 1MS21CS")
        print("- Professor: EMP001")
        print("- Past 5 days of attendance records")
        print("- Mixed present/absent status for testing")
        
    except Exception as e:
        print(f"❌ Error initializing attendance: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_attendance()