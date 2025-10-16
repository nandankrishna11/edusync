from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimetableBase(BaseModel):
    class_id: str
    day: str
    period_start: str
    period_end: str
    subject: str
    professor_id: str
    is_cancelled: bool = False
    cancel_reason: Optional[str] = None

class TimetableCreate(TimetableBase):
    pass

class TimetableCancel(BaseModel):
    class_id: str
    day: str
    period_start: str
    period_end: str
    cancel_reason: str

class TimetableUndoCancel(BaseModel):
    class_id: str
    day: str
    period_start: str
    period_end: str

class TimetableResponse(TimetableBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True