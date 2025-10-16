from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClassBase(BaseModel):
    title: str
    instructor: str
    students_count: int = 0
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    title: Optional[str] = None
    instructor: Optional[str] = None
    students_count: Optional[int] = None
    description: Optional[str] = None

class ClassResponse(ClassBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True