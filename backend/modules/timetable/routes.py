"""
Timetable routes with role-based access control
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_permission
from modules.auth.models import User
from . import schemas, services

router = APIRouter()


@router.get("/", response_model=List[schemas.Timetable])
def get_timetable(
    class_id: Optional[str] = None,
    day: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get timetable entries with optional filtering - accessible to all authenticated users"""
    return services.get_timetable(db=db, class_id=class_id, day=day)


@router.post("/", response_model=schemas.Timetable)
def create_timetable_entry(
    timetable: schemas.TimetableCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry - professors and admins only"""
    return services.create_timetable_entry(db=db, timetable=timetable)


@router.patch("/cancel")
def cancel_class(
    cancel_data: schemas.TimetableCancel,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Cancel a class - professors and admins only"""
    result = services.cancel_class(db=db, cancel_data=cancel_data)
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class cancelled successfully"}


@router.patch("/undo_cancel")
def restore_class(
    restore_data: schemas.TimetableRestore,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Restore a cancelled class - professors and admins only"""
    result = services.restore_class(db=db, restore_data=restore_data)
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class restored successfully"}


@router.get("/cancelled", response_model=List[schemas.Timetable])
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