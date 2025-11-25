"""
Enhanced schemas for attendance, notification, and analytics modules
"""
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, validator


# ============= ATTENDANCE SCHEMAS =============

class AttendanceCreate(BaseModel):
    student_usn: str
    subject_code: str
    date: date
    status: str  # "present", "absent", "cancelled"
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    room_number: Optional[str] = None
    remarks: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ["present", "absent", "cancelled"]
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {allowed_statuses}')
        return v


class AttendanceBulkCreate(BaseModel):
    subject_code: str
    date: date
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    room_number: Optional[str] = None
    attendance_records: List[Dict[str, Any]]  # [{"student_usn": "4KV23CS001", "status": "present"}]


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ["present", "absent", "cancelled"]
            if v not in allowed_statuses:
                raise ValueError(f'Status must be one of: {allowed_statuses}')
        return v


class AttendanceResponse(BaseModel):
    id: int
    student_usn: str
    subject_code: str
    date: date
    status: str
    period_start: Optional[str]
    period_end: Optional[str]
    room_number: Optional[str]
    marked_by: str
    marked_at: datetime
    remarks: Optional[str]
    
    class Config:
        from_attributes = True


class AttendanceStats(BaseModel):
    student_usn: str
    subject_code: str
    total_classes: int
    classes_attended: int
    classes_missed: int
    attendance_percentage: float
    last_updated: datetime


# ============= INTERNAL MARKS SCHEMAS =============

class InternalMarksCreate(BaseModel):
    student_usn: str
    subject_code: str
    assessment_type: str  # "IA1", "IA2", "IA3", "Assignment", "Quiz"
    max_marks: float
    obtained_marks: float
    assessment_date: date
    remarks: Optional[str] = None
    
    @validator('assessment_type')
    def validate_assessment_type(cls, v):
        allowed_types = ["IA1", "IA2", "IA3", "Assignment", "Quiz", "Lab", "Project"]
        if v not in allowed_types:
            raise ValueError(f'Assessment type must be one of: {allowed_types}')
        return v
    
    @validator('obtained_marks')
    def validate_marks(cls, v, values):
        if 'max_marks' in values and v > values['max_marks']:
            raise ValueError('Obtained marks cannot exceed max marks')
        if v < 0:
            raise ValueError('Obtained marks cannot be negative')
        return v


class InternalMarksBulkCreate(BaseModel):
    subject_code: str
    assessment_type: str
    max_marks: float
    assessment_date: date
    marks_records: List[Dict[str, Any]]  # [{"student_usn": "4KV23CS001", "obtained_marks": 85}]


class InternalMarksResponse(BaseModel):
    id: int
    student_usn: str
    subject_code: str
    assessment_type: str
    max_marks: float
    obtained_marks: float
    percentage: float
    assessment_date: date
    entered_by: str
    entered_at: datetime
    remarks: Optional[str]
    
    class Config:
        from_attributes = True


# ============= NOTIFICATION SCHEMAS =============

class NotificationCreate(BaseModel):
    title: str
    message: str
    target_type: str  # "global", "department", "semester", "individual"
    target_value: Optional[str] = None  # department_code, semester, or student_usn
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    notification_type: str = "general"  # "general", "academic", "exam", "event"
    expires_at: Optional[datetime] = None
    is_pinned: bool = False
    
    @validator('target_type')
    def validate_target_type(cls, v):
        allowed_types = ["global", "department", "semester", "individual"]
        if v not in allowed_types:
            raise ValueError(f'Target type must be one of: {allowed_types}')
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        allowed_priorities = ["low", "normal", "high", "urgent"]
        if v not in allowed_priorities:
            raise ValueError(f'Priority must be one of: {allowed_priorities}')
        return v


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    target_type: str
    target_value: Optional[str]
    priority: str
    notification_type: str
    created_by: str
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    is_pinned: bool
    is_read: Optional[bool] = None  # For student responses
    
    class Config:
        from_attributes = True


# ============= TIMETABLE SCHEMAS =============

class TimetableCreate(BaseModel):
    department_code: str
    semester: int
    section: str = "A"
    academic_year: str
    subject_code: str
    day: str
    period_start: str
    period_end: str
    room_number: Optional[str] = None
    professor_usn: str
    
    @validator('semester')
    def validate_semester(cls, v):
        if v < 1 or v > 8:
            raise ValueError('Semester must be between 1 and 8')
        return v
    
    @validator('day')
    def validate_day(cls, v):
        allowed_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        if v not in allowed_days:
            raise ValueError(f'Day must be one of: {allowed_days}')
        return v


class TimetableUpdate(BaseModel):
    is_cancelled: Optional[bool] = None
    cancel_reason: Optional[str] = None
    is_rescheduled: Optional[bool] = None
    reschedule_date: Optional[date] = None
    reschedule_time: Optional[str] = None


class TimetableResponse(BaseModel):
    id: int
    department_code: str
    semester: int
    section: str
    academic_year: str
    subject_code: str
    subject_name: Optional[str] = None
    day: str
    period_start: str
    period_end: str
    room_number: Optional[str]
    professor_usn: str
    professor_name: Optional[str] = None
    is_cancelled: bool
    cancel_reason: Optional[str]
    is_rescheduled: bool
    reschedule_date: Optional[date]
    reschedule_time: Optional[str]
    
    class Config:
        from_attributes = True


# ============= ANALYTICS SCHEMAS =============

class StudentAttendanceAnalytics(BaseModel):
    student_usn: str
    student_name: str
    department_code: str
    semester: int
    overall_attendance_percentage: float
    subject_wise_attendance: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]
    low_attendance_subjects: List[str]


class StudentMarksAnalytics(BaseModel):
    student_usn: str
    student_name: str
    department_code: str
    semester: int
    overall_percentage: float
    subject_wise_marks: List[Dict[str, Any]]
    assessment_wise_performance: Dict[str, float]
    ranking_info: Dict[str, Any]


class DepartmentAnalytics(BaseModel):
    department_code: str
    department_name: str
    total_students: int
    average_attendance: float
    average_marks: float
    top_performers: List[Dict[str, Any]]
    subject_wise_performance: List[Dict[str, Any]]
    attendance_trends: List[Dict[str, Any]]


class ProfessorAnalytics(BaseModel):
    professor_usn: str
    professor_name: str
    subjects_taught: List[str]
    total_classes_conducted: int
    average_attendance_in_classes: float
    subject_wise_performance: List[Dict[str, Any]]
    student_performance_summary: Dict[str, Any]


# ============= DASHBOARD SCHEMAS =============

class StudentDashboard(BaseModel):
    student_info: Dict[str, Any]
    timetable: List[TimetableResponse]
    attendance_summary: StudentAttendanceAnalytics
    marks_summary: StudentMarksAnalytics
    notifications: List[NotificationResponse]
    upcoming_classes: List[Dict[str, Any]]


class ProfessorDashboard(BaseModel):
    professor_info: Dict[str, Any]
    assigned_subjects: List[Dict[str, Any]]
    today_classes: List[Dict[str, Any]]
    attendance_summary: ProfessorAnalytics
    recent_notifications: List[NotificationResponse]
    pending_tasks: List[Dict[str, Any]]


class AdminDashboard(BaseModel):
    system_overview: Dict[str, Any]
    department_analytics: List[DepartmentAnalytics]
    recent_activities: List[Dict[str, Any]]
    system_alerts: List[Dict[str, Any]]
    quick_stats: Dict[str, Any]