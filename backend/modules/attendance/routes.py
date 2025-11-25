"""
Basic Attendance routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from database import get_db
from models.models import AttendanceModel, User, Timetable
from schemas.schemas import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse, 
    BulkAttendanceCreate, AttendanceStats
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin

router = APIRouter()


@router.post("/", response_model=AttendanceResponse)
def create_attendance(
    attendance: AttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new attendance record"""
    
    # Check if record already exists
    existing = db.query(AttendanceModel).filter(
        and_(
            AttendanceModel.class_id == attendance.class_id,
            AttendanceModel.usn == attendance.usn,
            AttendanceModel.date == attendance.date
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Attendance record already exists for {attendance.usn} on {attendance.date}"
        )
    
    # Set marked_by to current user
    attendance_data = attendance.dict()
    attendance_data["marked_by"] = current_user.user_id
    
    db_attendance = AttendanceModel(**attendance_data)
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance


@router.post("/bulk", response_model=Dict[str, Any])
def create_bulk_attendance(
    bulk_data: BulkAttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create multiple attendance records at once"""
    
    created_records = []
    errors = []
    
    for attendance_record in bulk_data.attendance_records:
        try:
            # Check if record already exists
            existing = db.query(AttendanceModel).filter(
                and_(
                    AttendanceModel.class_id == bulk_data.class_id,
                    AttendanceModel.usn == attendance_record.usn,
                    AttendanceModel.date == bulk_data.date
                )
            ).first()
            
            if existing:
                errors.append(f"Record exists for {attendance_record.usn}")
                continue
            
            # Create new record
            attendance_data = {
                "class_id": bulk_data.class_id,
                "usn": attendance_record.usn,
                "date": bulk_data.date,
                "period": bulk_data.period,
                "subject": bulk_data.subject,
                "status": attendance_record.status,
                "marked_by": current_user.user_id
            }
            
            db_attendance = AttendanceModel(**attendance_data)
            db.add(db_attendance)
            created_records.append(attendance_data)
            
        except Exception as e:
            errors.append(f"Error for {attendance_record.usn}: {str(e)}")
    
    db.commit()
    
    return {
        "created_count": len(created_records),
        "error_count": len(errors),
        "errors": errors,
        "message": f"Successfully created {len(created_records)} attendance records"
    }


@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    class_id: Optional[str] = Query(None),
    usn: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    subject: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get attendance records with filtering"""
    
    query = db.query(AttendanceModel)
    
    # Apply filters
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    
    if usn:
        query = query.filter(AttendanceModel.usn == usn)
    
    if subject:
        query = query.filter(AttendanceModel.subject.ilike(f"%{subject}%"))
    
    if status:
        query = query.filter(AttendanceModel.status == status)
    
    if date_from:
        query = query.filter(AttendanceModel.date >= date_from)
    
    if date_to:
        query = query.filter(AttendanceModel.date <= date_to)
    
    # Role-based filtering
    if current_user.role == "student":
        query = query.filter(AttendanceModel.usn == current_user.user_id)
    elif current_user.role == "professor":
        query = query.filter(AttendanceModel.marked_by == current_user.user_id)
    
    return query.order_by(desc(AttendanceModel.date)).all()


@router.get("/stats", response_model=AttendanceStats)
def get_attendance_stats(
    class_id: Optional[str] = Query(None),
    usn: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get attendance statistics"""
    
    query = db.query(AttendanceModel)
    
    # Apply filters
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    
    if usn:
        query = query.filter(AttendanceModel.usn == usn)
    
    if subject:
        query = query.filter(AttendanceModel.subject.ilike(f"%{subject}%"))
    
    # Role-based filtering
    if current_user.role == "student":
        query = query.filter(AttendanceModel.usn == current_user.user_id)
    elif current_user.role == "professor":
        query = query.filter(AttendanceModel.marked_by == current_user.user_id)
    
    records = query.all()
    
    total_records = len(records)
    present_count = len([r for r in records if r.status == "present"])
    absent_count = len([r for r in records if r.status == "absent"])
    
    attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0
    
    return {
        "total_records": total_records,
        "present_count": present_count,
        "absent_count": absent_count,
        "attendance_percentage": round(attendance_percentage, 2)
    }


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Update an attendance record"""
    
    db_attendance = db.query(AttendanceModel).filter(AttendanceModel.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Check if user has permission to update this record
    if current_user.role == "professor" and db_attendance.marked_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this record")
    
    # Update fields
    update_data = attendance_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_attendance, field, value)
    
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Delete an attendance record"""
    
    db_attendance = db.query(AttendanceModel).filter(AttendanceModel.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Check if user has permission to delete this record
    if current_user.role == "professor" and db_attendance.marked_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
    
    db.delete(db_attendance)
    db.commit()
    
    return {"message": "Attendance record deleted successfully"}