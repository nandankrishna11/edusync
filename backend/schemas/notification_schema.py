from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class NotificationBase(BaseModel):
    class_id: str
    type: str  # "cancellation", "resource", "notice"
    title: str
    message: str
    notification_metadata: Optional[Dict[str, Any]] = None
    student_id: Optional[str] = None  # None means notification for all students

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    notification_metadata: Optional[Dict[str, Any]] = None
    is_read: Optional[bool] = None

class NotificationMarkRead(BaseModel):
    notification_id: int

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True