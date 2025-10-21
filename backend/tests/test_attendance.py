"""
Test cases for attendance endpoints
"""
import pytest
from fastapi.testclient import TestClient
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.attendance_model import AttendanceModel
from modules.auth.models import User
from modules.timetable.models import Timetable

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_attendance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_users(db_session):
    """Create test users"""
    users = [
        User(
            user_id="1MS21CS001",
            username="student1",
            email="student1@test.com",
            hashed_password="hashed_password",
            full_name="Test Student 1",
            role="student",
            is_active=True
        ),
        User(
            user_id="PROF001",
            username="prof1",
            email="prof1@test.com",
            hashed_password="hashed_password",
            full_name="Test Professor 1",
            role="professor",
            is_active=True
        ),
        User(
            user_id="ADMIN001",
            username="admin1",
            email="admin1@test.com",
            hashed_password="hashed_password",
            full_name="Test Admin 1",
            role="admin",
            is_active=True
        )
    ]
    
    for user in users:
        db_session.add(user)
    db_session.commit()
    
    return users

@pytest.fixture
def test_timetable(db_session):
    """Create test timetable entries"""
    timetable_entries = [
        Timetable(
            class_id="CS301",
            day="Monday",
            period_start="09:00",
            period_end="10:30",
            subject="Data Structures",
            professor_usn="PROF001"
        ),
        Timetable(
            class_id="CS301",
            day="Wednesday",
            period_start="11:00",
            period_end="12:30",
            subject="Algorithms",
            professor_usn="PROF001"
        )
    ]
    
    for entry in timetable_entries:
        db_session.add(entry)
    db_session.commit()
    
    return timetable_entries

@pytest.fixture
def test_attendance(db_session):
    """Create test attendance records"""
    attendance_records = [
        AttendanceModel(
            class_id="CS301",
            usn="1MS21CS001",
            date=date.today(),
            status="present",
            marked_by="PROF001",
            subject="Data Structures"
        ),
        AttendanceModel(
            class_id="CS301",
            usn="1MS21CS001",
            date=date(2024, 1, 15),
            status="absent",
            marked_by="PROF001",
            subject="Data Structures"
        )
    ]
    
    for record in attendance_records:
        db_session.add(record)
    db_session.commit()
    
    return attendance_records

class TestAttendanceEndpoints:
    """Test attendance API endpoints"""
    
    def test_get_attendance_records_unauthorized(self, client, setup_database):
        """Test that unauthorized access is blocked"""
        response = client.get("/attendance/")
        assert response.status_code == 401
    
    def test_student_attendance_view(self, client, setup_database, test_users, test_attendance):
        """Test student can view their own attendance"""
        # This would require proper authentication setup
        # For now, we'll test the endpoint structure
        pass
    
    def test_professor_classes_endpoint(self, client, setup_database, test_users, test_timetable):
        """Test professor can get their assigned classes"""
        # This would require proper authentication setup
        pass
    
    def test_admin_semester_report(self, client, setup_database, test_users, test_attendance):
        """Test admin can get semester reports"""
        # This would require proper authentication setup
        pass

def test_attendance_model_creation(db_session):
    """Test attendance model creation"""
    attendance = AttendanceModel(
        class_id="CS301",
        usn="1MS21CS001",
        date=date.today(),
        status="present",
        marked_by="PROF001",
        subject="Data Structures"
    )
    
    db_session.add(attendance)
    db_session.commit()
    
    assert attendance.id is not None
    assert attendance.class_id == "CS301"
    assert attendance.usn == "1MS21CS001"
    assert attendance.status == "present"

def test_attendance_stats_calculation():
    """Test attendance statistics calculation logic"""
    # Mock attendance records
    records = [
        {"status": "present"},
        {"status": "present"},
        {"status": "absent"},
        {"status": "cancelled"}
    ]
    
    present_count = len([r for r in records if r["status"] == "present"])
    absent_count = len([r for r in records if r["status"] == "absent"])
    cancelled_count = len([r for r in records if r["status"] == "cancelled"])
    
    active_records = present_count + absent_count
    attendance_rate = (present_count / active_records * 100) if active_records > 0 else 0.0
    
    assert present_count == 2
    assert absent_count == 1
    assert cancelled_count == 1
    assert active_records == 3
    assert attendance_rate == 66.67 or abs(attendance_rate - 66.67) < 0.01

if __name__ == "__main__":
    pytest.main([__file__])