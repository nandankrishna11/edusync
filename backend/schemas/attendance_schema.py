from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class AttendanceBase(BaseModel):
    class_id: str
    student_id: str
    date: date
    status: str  # "present", "absent", "cancelled"
    marked_by: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    marked_by: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None

class AttendanceMarkRequest(BaseModel):
    class_id: str
    date: date
    period_start: str
    period_end: str
    subject: str
    student_attendances: List[dict]  # [{"student_id": "student_001", "status": "present"}]
    marked_by: str

class AttendanceAutoSkipRequest(BaseModel):
    class_id: str
    date: date
    period_start: str
    period_end: str

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceStatsResponse(BaseModel):
    student_id: str
    class_id: str
    subject: str
    total_classes: int
    present_count: int
    absent_count: int
    cancelled_count: int
    attendance_percentage: float