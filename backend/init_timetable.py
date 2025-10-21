"""
Initialize timetable with sample data
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from modules.timetable.models import Timetable

def create_sample_timetable():
    """Create sample timetable entries"""
    # Drop and recreate tables to ensure schema is updated
    Timetable.metadata.drop_all(bind=engine)
    Timetable.metadata.create_all(bind=engine)
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Sample timetable data
        sample_entries = [
            # Monday
            {
                "class_id": "1MS21CS",
                "day": "Monday",
                "period_start": "09:00",
                "period_end": "10:00",
                "subject": "Data Structures",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            {
                "class_id": "1MS21CS",
                "day": "Monday",
                "period_start": "10:00",
                "period_end": "11:00",
                "subject": "Mathematics",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            {
                "class_id": "1MS21CS",
                "day": "Monday",
                "period_start": "11:15",
                "period_end": "12:15",
                "subject": "Computer Networks",
                "professor_usn": "EMP001",
                "is_cancelled": True,
                "cancel_reason": "Professor unavailable due to conference"
            },
            
            # Tuesday
            {
                "class_id": "1MS21CS",
                "day": "Tuesday",
                "period_start": "09:00",
                "period_end": "10:00",
                "subject": "Operating Systems",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            {
                "class_id": "1MS21CS",
                "day": "Tuesday",
                "period_start": "10:00",
                "period_end": "11:00",
                "subject": "Database Management",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            
            # Wednesday
            {
                "class_id": "1MS21CS",
                "day": "Wednesday",
                "period_start": "09:00",
                "period_end": "10:00",
                "subject": "Software Engineering",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            {
                "class_id": "1MS21CS",
                "day": "Wednesday",
                "period_start": "11:15",
                "period_end": "12:15",
                "subject": "Web Technologies",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            
            # Thursday
            {
                "class_id": "1MS21CS",
                "day": "Thursday",
                "period_start": "09:00",
                "period_end": "10:00",
                "subject": "Machine Learning",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            {
                "class_id": "1MS21CS",
                "day": "Thursday",
                "period_start": "14:00",
                "period_end": "15:00",
                "subject": "Lab Session",
                "professor_usn": "EMP001",
                "is_cancelled": False
            },
            
            # Friday
            {
                "class_id": "1MS21CS",
                "day": "Friday",
                "period_start": "10:00",
                "period_end": "11:00",
                "subject": "Project Work",
                "professor_usn": "EMP001",
                "is_cancelled": False
            }
        ]
        
        created_count = 0
        for entry_data in sample_entries:
            # Check if entry already exists
            existing_entry = db.query(Timetable).filter(
                Timetable.class_id == entry_data["class_id"],
                Timetable.day == entry_data["day"],
                Timetable.period_start == entry_data["period_start"],
                Timetable.period_end == entry_data["period_end"]
            ).first()
            
            if not existing_entry:
                timetable_entry = Timetable(**entry_data)
                db.add(timetable_entry)
                created_count += 1
        
        db.commit()
        print(f"✓ Created {created_count} timetable entries")
        print("\n🎉 Sample timetable data initialized successfully!")
        print("\nSample timetable includes:")
        print("- Class: 1MS21CS")
        print("- Professor: EMP001")
        print("- Various subjects across weekdays")
        print("- One cancelled class (Monday 11:15-12:15)")
        
    except Exception as e:
        print(f"❌ Error initializing timetable: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_timetable()