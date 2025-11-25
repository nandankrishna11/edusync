"""
Timetable services
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from models.models import Timetable, User
from schemas.schemas import TimetableCreate, TimetableUpdate, TimetableCancel, TimetableRestore


def get_timetable(db: Session, class_id: Optional[str] = None, day: Optional[str] = None):
    """Get timetable entries with optional filtering"""
    query = db.query(Timetable)
    
    if class_id:
        query = query.filter(Timetable.class_id == class_id)
    if day:
        query = query.filter(Timetable.day == day)
    
    timetable_entries = query.all()
    return [_add_color_coding(entry) for entry in timetable_entries]


def create_timetable_entry(db: Session, timetable: TimetableCreate):
    """Create a new timetable entry"""
    timetable_data = timetable.dict(exclude_unset=True)
    
    # Ensure we have either legacy or new format
    if not timetable_data.get('class_id') and not (timetable_data.get('department_code') and timetable_data.get('semester')):
        raise ValueError("Either class_id or (department_code and semester) must be provided")
    
    db_timetable = Timetable(**timetable_data)
    db.add(db_timetable)
    db.commit()
    db.refresh(db_timetable)
    return _add_color_coding(db_timetable)


def cancel_class(db: Session, cancel_data: TimetableCancel):
    """Cancel a class - supports both legacy and new system"""
    # Build query for both systems
    query = db.query(Timetable).filter(
        Timetable.day == cancel_data.day,
        Timetable.period_start == cancel_data.period_start,
        Timetable.period_end == cancel_data.period_end
    )
    
    # Add class_id filter if provided (legacy system)
    if cancel_data.class_id:
        query = query.filter(Timetable.class_id == cancel_data.class_id)
    
    # Add department/semester filter if provided (new system)
    if cancel_data.department_code and cancel_data.semester:
        query = query.filter(
            Timetable.department_code == cancel_data.department_code,
            Timetable.semester == cancel_data.semester,
            Timetable.section == (cancel_data.section or 'A')
        )
    
    timetable_entry = query.first()
    
    if timetable_entry:
        timetable_entry.is_cancelled = True
        timetable_entry.cancel_reason = cancel_data.cancel_reason
        db.commit()
        return True
    return False


def restore_class(db: Session, restore_data: TimetableRestore):
    """Restore a cancelled class - supports both legacy and new system"""
    # Build query for both systems
    query = db.query(Timetable).filter(
        Timetable.day == restore_data.day,
        Timetable.period_start == restore_data.period_start,
        Timetable.period_end == restore_data.period_end
    )
    
    # Add class_id filter if provided (legacy system)
    if restore_data.class_id:
        query = query.filter(Timetable.class_id == restore_data.class_id)
    
    # Add department/semester filter if provided (new system)
    if restore_data.department_code and restore_data.semester:
        query = query.filter(
            Timetable.department_code == restore_data.department_code,
            Timetable.semester == restore_data.semester,
            Timetable.section == (restore_data.section or 'A')
        )
    
    timetable_entry = query.first()
    
    if timetable_entry:
        timetable_entry.is_cancelled = False
        timetable_entry.cancel_reason = None
        db.commit()
        return True
    return False


def get_cancelled_classes(db: Session):
    """Get all cancelled classes"""
    return db.query(Timetable).filter(Timetable.is_cancelled == True).all()


def get_next_class(db: Session, class_id: str):
    """Get next class for a specific class_id"""
    # This is a simplified version - in production, you'd implement proper date/time logic
    next_class = db.query(Timetable).filter(
        Timetable.class_id == class_id
    ).first()
    
    if next_class:
        return {
            "has_next_class": True,
            "next_class": {
                "class_id": next_class.class_id,
                "subject": next_class.subject,
                "day": next_class.day,
                "period_start": next_class.period_start,
                "period_end": next_class.period_end,
                "is_cancelled": next_class.is_cancelled,
                "cancel_reason": next_class.cancel_reason
            }
        }
    return {
        "has_next_class": False,
        "next_class": None
    }


def get_timetable_by_id(db: Session, timetable_id: int):
    """Get a specific timetable entry by ID with color coding"""
    timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    
    if timetable_entry:
        return _add_color_coding(timetable_entry)
    return None


def update_timetable_entry(db: Session, timetable_id: int, timetable_update: TimetableUpdate):
    """Update a timetable entry"""
    timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    
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
    timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    
    if timetable_entry:
        db.delete(timetable_entry)
        db.commit()
        return True
    return False


def get_professor_timetable(db: Session, professor_usn: str):
    """Get all timetable entries for a specific professor with color coding"""
    timetable_entries = db.query(Timetable).filter(
        Timetable.professor_usn == professor_usn
    ).all()
    
    return [_add_color_coding(entry) for entry in timetable_entries]


def get_class_status_with_colors(db: Session, class_id: str):
    """Get class status with color coding for students"""
    timetable_entries = db.query(Timetable).filter(
        Timetable.class_id == class_id
    ).all()
    
    return [_add_color_coding(entry) for entry in timetable_entries]


def get_semester_status_with_colors(db: Session, department_code: str, semester: int, section: str = "A"):
    """Get semester timetable with color coding for students"""
    timetable_entries = db.query(Timetable).filter(
        Timetable.department_code == department_code,
        Timetable.semester == semester,
        Timetable.section == section
    ).all()
    
    return [_add_color_coding(entry) for entry in timetable_entries]


def get_professors(db: Session, department: Optional[str] = None):
    """Get list of professors with their details"""
    
    query = db.query(User).filter(User.role == "professor", User.is_active == True)
    
    if department:
        # Filter by department if provided (assuming professors have department info)
        query = query.filter(User.department_code == department)
    
    professors = query.all()
    
    # Return professor information
    return [
        {
            "usn": prof.user_id,
            "name": prof.full_name,
            "email": prof.email,
            "department": getattr(prof, 'department_code', 'Unknown'),
            "specialization": getattr(prof, 'specialization', 'General')
        }
        for prof in professors
    ]


def get_department_semester_combinations(db: Session):
    """Get all unique department-semester combinations"""
    from sqlalchemy import distinct
    
    # Get all timetable entries with department and semester info
    entries = db.query(Timetable).filter(
        Timetable.department_code.isnot(None),
        Timetable.semester.isnot(None)
    ).all()
    
    # Group by department and semester
    result = {}
    for entry in entries:
        dept_code = entry.department_code
        semester = entry.semester
        section = entry.section or 'A'
        
        if dept_code not in result:
            result[dept_code] = {}
        if semester not in result[dept_code]:
            result[dept_code][semester] = []
        if section not in result[dept_code][semester]:
            result[dept_code][semester].append(section)
    
    return result


def get_department_semesters(db: Session, department_code: str):
    """Get all semesters for a specific department"""
    from sqlalchemy import distinct
    
    semesters = db.query(distinct(Timetable.semester)).filter(
        Timetable.department_code == department_code,
        Timetable.semester.isnot(None)
    ).order_by(Timetable.semester).all()
    
    return [sem[0] for sem in semesters if sem[0] is not None]


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
        # Legacy fields
        "class_id": timetable_entry.class_id,
        "subject": timetable_entry.subject,
        # New semester-based fields
        "department_code": timetable_entry.department_code,
        "semester": timetable_entry.semester,
        "section": timetable_entry.section,
        "subject_code": timetable_entry.subject_code,
        # Common fields
        "day": timetable_entry.day,
        "period_start": timetable_entry.period_start,
        "period_end": timetable_entry.period_end,
        "professor_usn": timetable_entry.professor_usn,
        "is_cancelled": timetable_entry.is_cancelled,
        "cancel_reason": timetable_entry.cancel_reason,
        "status": status,
        "color_code": color_code,
        "created_at": timetable_entry.created_at
    }