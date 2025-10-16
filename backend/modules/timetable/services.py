"""
Timetable services
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from . import models, schemas


def get_timetable(db: Session, class_id: Optional[str] = None, day: Optional[str] = None):
    """Get timetable entries with optional filtering"""
    query = db.query(models.Timetable)
    
    if class_id:
        query = query.filter(models.Timetable.class_id == class_id)
    if day:
        query = query.filter(models.Timetable.day == day)
    
    return query.all()


def create_timetable_entry(db: Session, timetable: schemas.TimetableCreate):
    """Create a new timetable entry"""
    db_timetable = models.Timetable(**timetable.dict())
    db.add(db_timetable)
    db.commit()
    db.refresh(db_timetable)
    return db_timetable


def cancel_class(db: Session, cancel_data: schemas.TimetableCancel):
    """Cancel a class"""
    timetable_entry = db.query(models.Timetable).filter(
        models.Timetable.class_id == cancel_data.class_id,
        models.Timetable.day == cancel_data.day,
        models.Timetable.period_start == cancel_data.period_start,
        models.Timetable.period_end == cancel_data.period_end
    ).first()
    
    if timetable_entry:
        timetable_entry.is_cancelled = True
        timetable_entry.cancel_reason = cancel_data.cancel_reason
        db.commit()
        return True
    return False


def restore_class(db: Session, restore_data: schemas.TimetableRestore):
    """Restore a cancelled class"""
    timetable_entry = db.query(models.Timetable).filter(
        models.Timetable.class_id == restore_data.class_id,
        models.Timetable.day == restore_data.day,
        models.Timetable.period_start == restore_data.period_start,
        models.Timetable.period_end == restore_data.period_end
    ).first()
    
    if timetable_entry:
        timetable_entry.is_cancelled = False
        timetable_entry.cancel_reason = None
        db.commit()
        return True
    return False


def get_cancelled_classes(db: Session):
    """Get all cancelled classes"""
    return db.query(models.Timetable).filter(models.Timetable.is_cancelled == True).all()


def get_next_class(db: Session, class_id: str):
    """Get next class for a specific class_id"""
    # This is a simplified version - in production, you'd implement proper date/time logic
    next_class = db.query(models.Timetable).filter(
        models.Timetable.class_id == class_id
    ).first()
    
    if next_class:
        return {
            "class_id": next_class.class_id,
            "subject": next_class.subject,
            "day": next_class.day,
            "period_start": next_class.period_start,
            "period_end": next_class.period_end,
            "is_cancelled": next_class.is_cancelled,
            "cancel_reason": next_class.cancel_reason
        }
    return None