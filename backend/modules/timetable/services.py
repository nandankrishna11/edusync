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


def get_timetable_by_id(db: Session, timetable_id: int):
    """Get a specific timetable entry by ID with color coding"""
    timetable_entry = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    
    if timetable_entry:
        return _add_color_coding(timetable_entry)
    return None


def update_timetable_entry(db: Session, timetable_id: int, timetable_update: schemas.TimetableUpdate):
    """Update a timetable entry"""
    timetable_entry = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    
    if timetable_entry:
        update_data = timetable_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(timetable_entry, field, value)
        
        db.commit()
        db.refresh(timetable_entry)
        return timetable_entry
    return None


def delete_timetable_entry(db: Session, timetable_id: int):
    """Delete a timetable entry"""
    timetable_entry = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    
    if timetable_entry:
        db.delete(timetable_entry)
        db.commit()
        return True
    return False


def get_professor_timetable(db: Session, professor_usn: str):
    """Get all timetable entries for a specific professor with color coding"""
    timetable_entries = db.query(models.Timetable).filter(
        models.Timetable.professor_usn == professor_usn
    ).all()
    
    return [_add_color_coding(entry) for entry in timetable_entries]


def get_class_status_with_colors(db: Session, class_id: str):
    """Get class status with color coding for students"""
    timetable_entries = db.query(models.Timetable).filter(
        models.Timetable.class_id == class_id
    ).all()
    
    return [_add_color_coding(entry) for entry in timetable_entries]


def _add_color_coding(timetable_entry):
    """Add color coding and status to timetable entry"""
    if timetable_entry.is_cancelled:
        status = "cancelled"
        color_code = "red"
    else:
        status = "active"
        color_code = "green"
    
    return {
        "id": timetable_entry.id,
        "class_id": timetable_entry.class_id,
        "day": timetable_entry.day,
        "period_start": timetable_entry.period_start,
        "period_end": timetable_entry.period_end,
        "subject": timetable_entry.subject,
        "professor_usn": timetable_entry.professor_usn,
        "is_cancelled": timetable_entry.is_cancelled,
        "cancel_reason": timetable_entry.cancel_reason,
        "status": status,
        "color_code": color_code,
        "created_at": timetable_entry.created_at
    }