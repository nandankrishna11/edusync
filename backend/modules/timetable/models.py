"""
Timetable models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Timetable(Base):
    __tablename__ = "timetable"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, nullable=False, index=True)
    day = Column(String, nullable=False)
    period_start = Column(String, nullable=False)
    period_end = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    professor_id = Column(String, nullable=False)
    is_cancelled = Column(Boolean, default=False)
    cancel_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())