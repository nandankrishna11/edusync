"""
Attendance schemas
"""
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class AttendanceBase(BaseModel):
    class_id: str
    usn: str  # Student USN
    date: date
    status: str  # "present", "absent", "cancelled"
    marked_by: Optional[str] = None  # Professor USN who marked attendance
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    class_id: Optional[str] = None
    usn: Optional[str] = None
    date: Optional[date] = None
    status: Optional[str] = None
    marked_by: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class BulkAttendanceCreate(BaseModel):
    class_id: str
    date: date
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None
    attendance_records: List[dict]  # [{"usn": "1MS21CS001", "status": "present"}, ...]


class AttendanceStats(BaseModel):
    total_records: int
    present_count: int
    absent_count: int
    cancelled_count: int
    attendance_rate: float
    active_records: int  # Excludes cancelled classes
    unique_students: Optional[int] = None
    classes: Optional[List[str]] = None


class StudentAttendanceRecord(BaseModel):
    id: int
    class_id: str
    subject: str
    date: date
    status: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    marked_by: Optional[str] = None


class SubjectSummary(BaseModel):
    subject: str
    class_id: str
    total_classes: int
    present: int
    absent: int
    cancelled: int
    attendance_percentage: float


class StudentAttendanceResponse(BaseModel):
    student_usn: str
    student_name: str
    total_records: int
    subject_wise_summary: List[SubjectSummary]
    detailed_records: List[StudentAttendanceRecord]


class ProfessorClassSchedule(BaseModel):
    day: str
    period_start: str
    period_end: str
    is_cancelled: bool
    cancel_reason: Optional[str] = None


class ProfessorClassSummary(BaseModel):
    total_classes_conducted: int
    average_attendance: float


class ProfessorClass(BaseModel):
    class_id: str
    subject: str
    schedule: List[ProfessorClassSchedule]
    total_students: int
    attendance_summary: ProfessorClassSummary


class ProfessorClassesResponse(BaseModel):
    professor_usn: str
    professor_name: str
    assigned_classes: List[ProfessorClass]


class StudentForAttendance(BaseModel):
    usn: str
    name: str
    email: Optional[str] = None
    attendance_status: Optional[str] = None  # For specific date
    total_classes: Optional[int] = None  # For summary view
    present_count: Optional[int] = None  # For summary view
    attendance_percentage: Optional[float] = None  # For summary view


class ClassStudentsResponse(BaseModel):
    class_id: str
    subject: str
    professor: str
    date_filter: Optional[date] = None
    total_students: int
    students: List[StudentForAttendance]