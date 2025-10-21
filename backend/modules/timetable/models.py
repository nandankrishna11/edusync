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
    professor_usn = Column(String, nullable=False, index=True)  # Professor USN (e.g., "PROF001")
    is_cancelled = Column(Boolean, default=False, nullable=False)
    cancel_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Timetable(id={self.id}, class_id='{self.class_id}', day='{self.day}', period='{self.period_start}-{self.period_end}', cancelled={self.is_cancelled})>"