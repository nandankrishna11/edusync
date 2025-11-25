"""
Timetable routes with role-based access control
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_permission
from models.models import User, Timetable
from . import services
from schemas.schemas import TimetableCreate, TimetableUpdate, TimetableResponse, TimetableCancel, TimetableRestore

router = APIRouter()


@router.get("/", response_model=List[TimetableResponse])
def get_timetable(
    class_id: Optional[str] = None,
    day: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get timetable entries with optional filtering - accessible to all authenticated users"""
    return services.get_timetable(db=db, class_id=class_id, day=day)


@router.post("/", response_model=TimetableResponse)
def create_timetable_entry(
    timetable: TimetableCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry - professors and admins only"""
    return services.create_timetable_entry(db=db, timetable=timetable)


@router.patch("/cancel")
def cancel_class(
    cancel_data: TimetableCancel,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Cancel a class - professors and admins only"""
    # Check if professor is trying to cancel their own class
    if current_user.role == "professor":
        # Handle both legacy and new system
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
        
        if not timetable_entry:
            raise HTTPException(status_code=404, detail="Class not found")
            
        if timetable_entry.professor_usn != current_user.user_id:
            raise HTTPException(
                status_code=403, 
                detail="Professors can only cancel their own classes"
            )
    
    result = services.cancel_class(db=db, cancel_data=cancel_data)
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class cancelled successfully"}


@router.patch("/undo_cancel")
def restore_class(
    restore_data: TimetableRestore,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Restore a cancelled class - professors and admins only"""
    # Check if professor is trying to restore their own class
    if current_user.role == "professor":
        # Handle both legacy and new system
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
        
        if not timetable_entry:
            raise HTTPException(status_code=404, detail="Class not found")
            
        if timetable_entry.professor_usn != current_user.user_id:
            raise HTTPException(
                status_code=403, 
                detail="Professors can only restore their own classes"
            )
    
    result = services.restore_class(db=db, restore_data=restore_data)
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class restored successfully"}


@router.get("/cancelled", response_model=List[TimetableResponse])
def get_cancelled_classes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all cancelled classes - accessible to all authenticated users"""
    return services.get_cancelled_classes(db=db)


@router.get("/next_class")
def get_next_class(
    class_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get next class for a specific class_id - accessible to all authenticated users"""
    return services.get_next_class(db=db, class_id=class_id)


@router.get("/{timetable_id}", response_model=TimetableResponse)
def get_timetable_entry(
    timetable_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific timetable entry by ID"""
    timetable_entry = services.get_timetable_by_id(db=db, timetable_id=timetable_id)
    if not timetable_entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return timetable_entry


@router.put("/{timetable_id}", response_model=TimetableResponse)
def update_timetable_entry(
    timetable_id: int,
    timetable_update: TimetableUpdate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Update a timetable entry - professors and admins only"""
    updated_entry = services.update_timetable_entry(db=db, timetable_id=timetable_id, timetable_update=timetable_update)
    if not updated_entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return updated_entry


@router.delete("/{timetable_id}")
def delete_timetable_entry(
    timetable_id: int,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Delete a timetable entry - professors and admins only"""
    success = services.delete_timetable_entry(db=db, timetable_id=timetable_id)
    if not success:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return {"message": "Timetable entry deleted successfully"}


@router.get("/professor/{professor_usn}", response_model=List[TimetableResponse])
def get_professor_timetable(
    professor_usn: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get timetable for a specific professor"""
    # Professors can only see their own timetable, admins can see any
    if current_user.role != "admin" and current_user.user_id != professor_usn:
        raise HTTPException(status_code=403, detail="Not authorized to view this timetable")
    
    return services.get_professor_timetable(db=db, professor_usn=professor_usn)


@router.get("/class/{class_id}/status", response_model=List[TimetableResponse])
def get_class_status(
    class_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get class status with color coding for students"""
    return services.get_class_status_with_colors(db=db, class_id=class_id)


@router.get("/professors")
def get_professors(
    department: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of professors for suggestions"""
    return services.get_professors(db=db, department=department)


@router.get("/departments")
def get_department_semester_combinations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available department-semester combinations"""
    return services.get_department_semester_combinations(db=db)


@router.get("/department/{department_code}/semesters")
def get_department_semesters(
    department_code: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all semesters for a specific department"""
    return services.get_department_semesters(db=db, department_code=department_code)


@router.get("/semester/{department_code}/{semester}/status", response_model=List[TimetableResponse])
def get_semester_status(
    department_code: str,
    semester: int,
    section: str = "A",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get semester timetable with color coding for students"""
    return services.get_semester_status_with_colors(db=db, department_code=department_code, semester=semester, section=section)