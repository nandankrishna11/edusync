"""
Notification schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class NotificationBase(BaseModel):
    class_id: str
    type: str
    title: str
    message: str
    notification_metadata: Optional[Dict[str, Any]] = None
    student_id: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    class_id: Optional[str] = None
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    notification_metadata: Optional[Dict[str, Any]] = None
    is_read: Optional[bool] = None
    student_id: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True