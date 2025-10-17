"""
Attendance routes with role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date

from database import get_db
from models.attendance_model import AttendanceModel
from schemas.attendance_schema import AttendanceResponse, AttendanceCreate, AttendanceUpdate
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin
from modules.auth.models import User

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance_records(
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    status: Optional[str] = Query(None, description="Filter by status: present, absent, cancelled"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    limit: int = Query(100, description="Maximum number of records to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get attendance records with role-based filtering"""
    query = db.query(AttendanceModel)
    
    # Role-based filtering
    if current_user.role == "student":
        # Students can only see their own attendance
        query = query.filter(AttendanceModel.student_id == current_user.username)
    elif current_user.role == "professor":
        # Professors can see attendance for all classes (they teach multiple classes)
        pass  # No additional filtering needed for professors
    # Admins can see all records
    
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    if student_id and current_user.role in ["professor", "admin"]:
        query = query.filter(AttendanceModel.student_id == student_id)
    if status:
        query = query.filter(AttendanceModel.status == status)
    if date_from:
        query = query.filter(AttendanceModel.date >= date_from)
    if date_to:
        query = query.filter(AttendanceModel.date <= date_to)
    
    records = query.order_by(AttendanceModel.date.desc(), AttendanceModel.student_id).limit(limit).all()
    return records

@router.post("/", response_model=AttendanceResponse)
async def create_attendance_record(
    attendance: AttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a single attendance record - professors and admins only"""
    # Check if record already exists
    existing = db.query(AttendanceModel).filter(
        and_(
            AttendanceModel.class_id == attendance.class_id,
            AttendanceModel.student_id == attendance.student_id,
            AttendanceModel.date == attendance.date
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Attendance record already exists for {attendance.student_id} on {attendance.date}"
        )
    
    db_attendance = AttendanceModel(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.post("/bulk")
async def create_bulk_attendance(
    attendance_records: List[AttendanceCreate],
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create multiple attendance records at once - professors and admins only"""
    created_records = []
    errors = []
    
    for i, attendance in enumerate(attendance_records):
        try:
            existing = db.query(AttendanceModel).filter(
                and_(
                    AttendanceModel.class_id == attendance.class_id,
                    AttendanceModel.student_id == attendance.student_id,
                    AttendanceModel.date == attendance.date
                )
            ).first()
            
            if existing:
                errors.append({
                    "index": i,
                    "error": f"Record already exists for {attendance.student_id} on {attendance.date}"
                })
                continue
            
            db_attendance = AttendanceModel(**attendance.dict())
            db.add(db_attendance)
            created_records.append(attendance.dict())
            
        except Exception as e:
            errors.append({
                "index": i,
                "error": str(e)
            })
    
    if created_records:
        db.commit()
    
    return {
        "created_count": len(created_records),
        "error_count": len(errors),
        "created_records": created_records,
        "errors": errors
    }

@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance_record(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Update an attendance record - professors and admins only"""
    db_attendance = db.query(AttendanceModel).filter(AttendanceModel.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    update_data = attendance_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_attendance, field, value)
    
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.delete("/{attendance_id}")
async def delete_attendance_record(
    attendance_id: int,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Delete an attendance record - professors and admins only"""
    db_attendance = db.query(AttendanceModel).filter(AttendanceModel.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    db.delete(db_attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}