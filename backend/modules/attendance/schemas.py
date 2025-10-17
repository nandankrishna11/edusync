"""
Attendance schemas
"""
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class AttendanceBase(BaseModel):
    class_id: str
    student_id: str
    date: date
    status: str
    marked_by: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    class_id: Optional[str] = None
    student_id: Optional[str] = None
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