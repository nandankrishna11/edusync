"""
Consolidated Schemas for Classroom Management System
All Pydantic schemas in one place for better organization
"""
from pydantic import BaseModel, validator
from datetime import date, datetime
from typing import Optional, List, Dict, Any
import re


# ==================== AUTH SCHEMAS ====================

class UserBase(BaseModel):
    user_id: str  # USN for students (4KV22CS001), PROF_ID for professors (PROF001), ADMIN_ID for admins (ADMIN001)
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "student"
    student_usn: Optional[str] = None  # For linking to Student table
    department_code: Optional[str] = None  # CS, ME, EC, etc.
    
    @validator('user_id')
    def validate_user_id_format(cls, v):
        """Validate user_id format based on role patterns"""
        if not v:
            raise ValueError('User ID is required')
        
        # USN format for students: 4KV22CS001 (3 chars + 2 digits + 2 chars + 3 digits)
        usn_pattern = r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$'
        # Professor format: PROF001, EMP001, etc.
        prof_pattern = r'^(PROF|EMP)[0-9]{3,4}$'
        # Admin format: ADMIN001, ADM001, etc.
        admin_pattern = r'^(ADMIN|ADM)[0-9]{3,4}$'
        
        if not (re.match(usn_pattern, v) or re.match(prof_pattern, v) or re.match(admin_pattern, v)):
            raise ValueError('Invalid user ID format. Use USN (4KV22CS001), Employee ID (EMP001), or Admin ID (ADMIN001)')
        
        return v.upper()


class UserCreate(BaseModel):
    user_id: str  # USN format: 4KV22CS001 for students, PROF001 for professors, ADMIN001 for admins
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str = "student"
    department_code: Optional[str] = None  # Required for professors and students
    
    @validator('user_id')
    def validate_user_id_format(cls, v):
        """Validate user_id format based on role patterns"""
        if not v:
            raise ValueError('User ID is required')
        
        # USN format for students: 4KV22CS001 (3 chars + 2 digits + 2 chars + 3 digits)
        usn_pattern = r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$'
        # Professor format: PROF001, EMP001, etc.
        prof_pattern = r'^(PROF|EMP)[0-9]{3,4}$'
        # Admin format: ADMIN001, ADM001, etc.
        admin_pattern = r'^(ADMIN|ADM)[0-9]{3,4}$'
        
        if not (re.match(usn_pattern, v) or re.match(prof_pattern, v) or re.match(admin_pattern, v)):
            raise ValueError('Invalid user ID format. Use USN (4KV22CS001), Employee ID (EMP001), or Admin ID (ADMIN001)')
        
        return v.upper()
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class UserUpdate(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    student_usn: Optional[str] = None
    department_code: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class LoginRequest(BaseModel):
    user_id: str  # Can be USN, Employee ID, or Admin ID
    password: str
    
    @validator('user_id')
    def validate_user_id_format(cls, v):
        """Validate user_id format for login"""
        if not v:
            raise ValueError('User ID is required')
        return v.upper()


class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str


# ==================== TIMETABLE SCHEMAS ====================

class TimetableBase(BaseModel):
    # Legacy support
    class_id: Optional[str] = None
    subject: Optional[str] = None
    
    # New semester-based fields
    department_code: Optional[str] = None  # CS, ME, EC
    semester: Optional[int] = None  # 1-8
    section: Optional[str] = "A"  # A, B, C
    subject_code: Optional[str] = None  # BCS801
    
    # Common fields
    day: str
    period_start: str
    period_end: str
    professor_usn: str  # Professor USN (e.g., "PROF001")


class TimetableCreate(TimetableBase):
    pass


class TimetableUpdate(BaseModel):
    # Legacy support
    class_id: Optional[str] = None
    subject: Optional[str] = None
    
    # New semester-based fields
    department_code: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    subject_code: Optional[str] = None
    
    # Common fields
    day: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    professor_usn: Optional[str] = None
    is_cancelled: Optional[bool] = None
    cancel_reason: Optional[str] = None


class TimetableCancel(BaseModel):
    # Legacy support
    class_id: Optional[str] = None
    
    # New semester-based fields (alternative to class_id)
    department_code: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    
    # Common fields
    day: str
    period_start: str
    period_end: str
    cancel_reason: str


class TimetableRestore(BaseModel):
    # Legacy support
    class_id: Optional[str] = None
    
    # New semester-based fields (alternative to class_id)
    department_code: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    
    # Common fields
    day: str
    period_start: str
    period_end: str


class Timetable(TimetableBase):
    id: int
    is_cancelled: bool
    cancel_reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TimetableResponse(BaseModel):
    id: int
    
    # Legacy support
    class_id: Optional[str] = None
    subject: Optional[str] = None
    
    # New semester-based fields
    department_code: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    subject_code: Optional[str] = None
    
    # Common fields
    day: str
    period_start: str
    period_end: str
    professor_usn: str
    is_cancelled: bool
    cancel_reason: Optional[str] = None
    status: str  # 'active', 'cancelled'
    color_code: str  # 'green', 'red', 'yellow'
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== ATTENDANCE SCHEMAS ====================

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


# ==================== ENHANCED ATTENDANCE SCHEMAS ====================

class EnhancedAttendanceBase(BaseModel):
    student_usn: str
    department_code: str
    semester: int
    section: str = "A"
    subject_code: str
    date: date
    period_start: str
    period_end: str
    status: str = "present"  # present, absent, cancelled
    professor_usn: str

    @validator('student_usn')
    def validate_usn(cls, v):
        if not re.match(r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$', v):
            raise ValueError('Invalid USN format. Expected format: 4KV22CS001')
        return v.upper()

    @validator('status')
    def validate_status(cls, v):
        if v not in ['present', 'absent', 'cancelled']:
            raise ValueError('Status must be present, absent, or cancelled')
        return v


class EnhancedAttendanceCreate(EnhancedAttendanceBase):
    pass


class EnhancedAttendanceUpdate(BaseModel):
    status: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['present', 'absent', 'cancelled']:
            raise ValueError('Status must be present, absent, or cancelled')
        return v


class EnhancedAttendanceResponse(EnhancedAttendanceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class BulkEnhancedAttendanceCreate(BaseModel):
    department_code: str
    semester: int
    section: str = "A"
    subject_code: str
    date: date
    period_start: str
    period_end: str
    professor_usn: str
    attendance_records: List[Dict[str, str]]  # [{"student_usn": "4KV22CS001", "status": "present"}]


# ==================== MARKS SCHEMAS ====================

class StudentMarksBase(BaseModel):
    student_usn: str
    department_code: str
    semester: int
    section: str = "A"
    subject_code: str
    assessment_type: str  # IA1, IA2, IA3, Assignment, Quiz, Final
    assessment_name: str
    max_marks: float
    obtained_marks: float
    assessment_date: date
    remarks: Optional[str] = None
    professor_usn: str

    @validator('student_usn')
    def validate_usn(cls, v):
        if not re.match(r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$', v):
            raise ValueError('Invalid USN format. Expected format: 4KV22CS001')
        return v.upper()

    @validator('assessment_type')
    def validate_assessment_type(cls, v):
        valid_types = ['IA1', 'IA2', 'IA3', 'Assignment', 'Quiz', 'Final', 'Lab', 'Project']
        if v not in valid_types:
            raise ValueError(f'Assessment type must be one of: {", ".join(valid_types)}')
        return v

    @validator('obtained_marks')
    def validate_obtained_marks(cls, v, values):
        if 'max_marks' in values and v > values['max_marks']:
            raise ValueError('Obtained marks cannot exceed maximum marks')
        if v < 0:
            raise ValueError('Obtained marks cannot be negative')
        return v


class StudentMarksCreate(StudentMarksBase):
    pass


class StudentMarksUpdate(BaseModel):
    obtained_marks: Optional[float] = None
    remarks: Optional[str] = None
    
    @validator('obtained_marks')
    def validate_obtained_marks(cls, v):
        if v is not None and v < 0:
            raise ValueError('Obtained marks cannot be negative')
        return v


class StudentMarksResponse(StudentMarksBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class BulkMarksCreate(BaseModel):
    department_code: str
    semester: int
    section: str = "A"
    subject_code: str
    assessment_type: str
    assessment_name: str
    max_marks: float
    assessment_date: date
    professor_usn: str
    marks_records: List[Dict[str, Any]]  # [{"student_usn": "4KV22CS001", "obtained_marks": 18.5, "remarks": "Good"}]


# ==================== SUMMARY SCHEMAS ====================

class AttendanceSummaryResponse(BaseModel):
    student_usn: str
    subject_code: str
    department_code: str
    semester: int
    total_classes: int
    present_count: int
    absent_count: int
    cancelled_count: int
    attendance_percentage: float
    first_class_date: Optional[date] = None
    last_class_date: Optional[date] = None
    
    class Config:
        from_attributes = True


class MarksSummaryResponse(BaseModel):
    student_usn: str
    subject_code: str
    department_code: str
    semester: int
    ia1_marks: float
    ia2_marks: float
    ia3_marks: float
    assignment_marks: float
    quiz_marks: float
    final_marks: float
    total_ia_marks: float
    total_obtained_marks: float
    total_max_marks: float
    percentage: float
    grade: Optional[str] = None
    
    class Config:
        from_attributes = True


class StudentDashboard(BaseModel):
    student_usn: str
    student_name: str
    department_code: str
    semester: int
    section: str
    attendance_summary: List[AttendanceSummaryResponse]
    marks_summary: List[MarksSummaryResponse]
    overall_attendance: float
    overall_percentage: float


# ==================== NOTIFICATION SCHEMAS ====================

class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str = "general"
    target_role: Optional[str] = None
    target_user_id: Optional[str] = None
    target_department: Optional[str] = None
    target_semester: Optional[int] = None
    priority: str = "normal"


class NotificationCreate(NotificationBase):
    created_by: str


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: int
    is_active: bool
    created_by: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== MARKS SCHEMAS ====================

class MarkCreate(BaseModel):
    student_id: str
    subject_code: str
    assessment_type: str
    assessment_name: Optional[str] = None
    marks_obtained: float
    max_marks: float
    department_code: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    assessment_date: Optional[date] = None
    remarks: Optional[str] = None


class MarkUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    assessment_name: Optional[str] = None
    remarks: Optional[str] = None


class MarkResponse(BaseModel):
    id: int
    student_id: str
    subject_code: str
    professor_id: str
    assessment_type: str
    assessment_name: Optional[str]
    marks_obtained: float
    max_marks: float
    department_code: Optional[str]
    semester: Optional[int]
    academic_year: Optional[str]
    assessment_date: Optional[date]
    remarks: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== ASSIGNMENT SCHEMAS ====================

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_code: str
    department_code: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    max_marks: float = 100
    assigned_date: date
    due_date: date


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    max_marks: Optional[float] = None
    is_active: Optional[bool] = None


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject_code: str
    professor_id: str
    department_code: Optional[str]
    semester: Optional[int]
    section: Optional[str]
    max_marks: float
    assigned_date: date
    due_date: date
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: Optional[str] = None
    file_path: Optional[str] = None


class SubmissionGrade(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: str
    submission_text: Optional[str]
    file_path: Optional[str]
    submitted_at: Optional[datetime]
    marks_obtained: Optional[float]
    feedback: Optional[str]
    graded_by: Optional[str]
    graded_at: Optional[datetime]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
