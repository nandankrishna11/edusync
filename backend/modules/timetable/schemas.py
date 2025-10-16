"""
Timetable schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TimetableBase(BaseModel):
    class_id: str
    day: str
    period_start: str
    period_end: str
    subject: str
    professor_id: str


class TimetableCreate(TimetableBase):
    pass


class TimetableUpdate(BaseModel):
    class_id: Optional[str] = None
    day: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    subject: Optional[str] = None
    professor_id: Optional[str] = None
    is_cancelled: Optional[bool] = None
    cancel_reason: Optional[str] = None


class TimetableCancel(BaseModel):
    class_id: str
    day: str
    period_start: str
    period_end: str
    cancel_reason: str


class TimetableRestore(BaseModel):
    class_id: str
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