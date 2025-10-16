from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date

from database import get_db
from models.attendance_model import AttendanceModel
from schemas.attendance_schema import AttendanceResponse, AttendanceCreate, AttendanceUpdate

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    status: Optional[str] = Query(None, description="Filter by status: present, absent, cancelled"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    limit: int = Query(100, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """Get attendance records with optional filtering"""
    query = db.query(AttendanceModel)
    
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    if student_id:
        query = query.filter(AttendanceModel.student_id == student_id)
    if status:
        query = query.filter(AttendanceModel.status == status)
    if date_from:
        query = query.filter(AttendanceModel.date >= date_from)
    if date_to:
        query = query.filter(AttendanceModel.date <= date_to)
    
    records = query.order_by(AttendanceModel.date.desc(), AttendanceModel.student_id).limit(limit).all()
    return records

@router.post("/bulk")
def create_bulk_attendance(
    attendance_records: List[AttendanceCreate], 
    db: Session = Depends(get_db)
):
    """Create multiple attendance records at once"""
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