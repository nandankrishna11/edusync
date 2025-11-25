"""
Enhanced Attendance Routes
USN-based system with automatic student class generation
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from database import get_db
from models.models import (
    EnhancedAttendance, StudentMarks, StudentRegistry, SubjectMaster,
    AttendanceSummary, MarksSummary, User, Timetable
)
from schemas.schemas import (
    EnhancedAttendanceCreate, EnhancedAttendanceResponse, EnhancedAttendanceUpdate,
    BulkEnhancedAttendanceCreate, StudentMarksCreate, StudentMarksResponse, StudentMarksUpdate,
    BulkMarksCreate, AttendanceSummaryResponse,
    MarksSummaryResponse, StudentDashboard
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin

router = APIRouter(prefix="/enhanced", tags=["enhanced-attendance"])


# ==================== ATTENDANCE ROUTES ====================

@router.post("/attendance", response_model=EnhancedAttendanceResponse)
async def create_attendance_record(
    attendance: EnhancedAttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a single attendance record"""
    # Verify professor is assigned to this subject (check timetable)
    if current_user.role == "professor":
        # Check if professor teaches this subject to this class
        timetable_entry = db.query(Timetable).filter(
            and_(
                Timetable.department_code == attendance.department_code,
                Timetable.semester == attendance.semester,
                Timetable.section == attendance.section,
                Timetable.subject_code == attendance.subject_code,
                Timetable.professor_usn == current_user.user_id
            )
        ).first()
        
        if not timetable_entry:
            raise HTTPException(
                status_code=403,
                detail=f"You are not assigned to teach {attendance.subject_code} to {attendance.department_code} Semester {attendance.semester} Section {attendance.section}"
            )
    
    # Check if record already exists
    existing = db.query(EnhancedAttendance).filter(
        and_(
            EnhancedAttendance.student_usn == attendance.student_usn,
            EnhancedAttendance.subject_code == attendance.subject_code,
            EnhancedAttendance.date == attendance.date,
            EnhancedAttendance.period_start == attendance.period_start
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Attendance record already exists for {attendance.student_usn} on {attendance.date}"
        )
    
    # Create attendance record
    db_attendance = EnhancedAttendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance


@router.post("/attendance/bulk")
async def create_bulk_attendance(
    bulk_data: BulkEnhancedAttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create attendance records for entire class"""
    # Verify professor assignment
    if current_user.role == "professor":
        timetable_entry = db.query(Timetable).filter(
            and_(
                Timetable.department_code == bulk_data.department_code,
                Timetable.semester == bulk_data.semester,
                Timetable.section == bulk_data.section,
                Timetable.subject_code == bulk_data.subject_code,
                Timetable.professor_usn == current_user.user_id
            )
        ).first()
        
        if not timetable_entry:
            raise HTTPException(
                status_code=403,
                detail=f"You are not assigned to teach {bulk_data.subject_code}"
            )
    
    created_records = []
    errors = []
    
    for i, record in enumerate(bulk_data.attendance_records):
        try:
            student_usn = record.get("student_usn")
            status = record.get("status", "present")
            
            if not student_usn:
                errors.append({"index": i, "error": "student_usn is required"})
                continue
            
            # Check if record already exists
            existing = db.query(EnhancedAttendance).filter(
                and_(
                    EnhancedAttendance.student_usn == student_usn,
                    EnhancedAttendance.subject_code == bulk_data.subject_code,
                    EnhancedAttendance.date == bulk_data.date,
                    EnhancedAttendance.period_start == bulk_data.period_start
                )
            ).first()
            
            if existing:
                errors.append({
                    "index": i,
                    "error": f"Record already exists for {student_usn}"
                })
                continue
            
            # Create attendance record
            attendance_data = {
                "student_usn": student_usn,
                "department_code": bulk_data.department_code,
                "semester": bulk_data.semester,
                "section": bulk_data.section,
                "subject_code": bulk_data.subject_code,
                "date": bulk_data.date,
                "period_start": bulk_data.period_start,
                "period_end": bulk_data.period_end,
                "status": status,
                "professor_usn": bulk_data.professor_usn
            }
            
            db_attendance = EnhancedAttendance(**attendance_data)
            db.add(db_attendance)
            created_records.append(attendance_data)
            
        except Exception as e:
            errors.append({"index": i, "error": str(e)})
    
    if created_records:
        db.commit()
    
    return {
        "created_count": len(created_records),
        "error_count": len(errors),
        "created_records": created_records,
        "errors": errors
    }


@router.get("/attendance/professor/classes")
async def get_professor_classes_for_attendance(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get classes assigned to professor for attendance marking"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Get all classes assigned to this professor
    timetable_entries = db.query(Timetable).filter(
        Timetable.professor_usn == current_user.user_id
    ).all()
    
    if not timetable_entries:
        return {
            "professor_usn": current_user.user_id,
            "professor_name": current_user.full_name,
            "assigned_classes": [],
            "message": "No classes assigned"
        }
    
    # Group by department, semester, section, subject
    classes_data = {}
    
    for entry in timetable_entries:
        if not entry.department_code or not entry.semester or not entry.subject_code:
            continue  # Skip legacy entries without proper semester info
        
        class_key = f"{entry.department_code}_{entry.semester}_{entry.section}_{entry.subject_code}"
        
        if class_key not in classes_data:
            # Get subject name from subject master or use subject code
            subject_name = entry.subject_code  # Default to code
            subject_master = db.query(SubjectMaster).filter(
                SubjectMaster.subject_code == entry.subject_code
            ).first()
            if subject_master:
                subject_name = subject_master.subject_name
            
            classes_data[class_key] = {
                "department_code": entry.department_code,
                "semester": entry.semester,
                "section": entry.section,
                "subject_code": entry.subject_code,
                "subject_name": subject_name,
                "schedule": [],
                "total_students": 60  # Default estimate
            }
        
        classes_data[class_key]["schedule"].append({
            "day": entry.day,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "is_cancelled": entry.is_cancelled
        })
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "assigned_classes": list(classes_data.values())
    }


@router.get("/attendance/class-students")
async def get_class_students_for_attendance(
    department_code: str = Query(...),
    semester: int = Query(...),
    section: str = Query("A"),
    subject_code: str = Query(...),
    date_filter: Optional[date] = Query(None),
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Get students in a class for attendance marking"""
    # Verify professor assignment
    if current_user.role == "professor":
        timetable_entry = db.query(Timetable).filter(
            and_(
                Timetable.department_code == department_code,
                Timetable.semester == semester,
                Timetable.section == section,
                Timetable.subject_code == subject_code,
                Timetable.professor_usn == current_user.user_id
            )
        ).first()
        
        if not timetable_entry:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to teach this subject to this class"
            )
    
    # Generate mock student list for demonstration
    # In production, this would use the USN generation utility
    student_usns = []
    for i in range(1, 61):  # Generate 60 students
        usn = f"4KV22{department_code}{i:03d}"
        student_usns.append(usn)
    
    # Get student details from User table
    students_query = db.query(User).filter(
        and_(
            User.user_id.in_(student_usns),
            User.role == "student"
        )
    )
    
    existing_students = students_query.all()
    existing_usns = {student.user_id for student in existing_students}
    
    # Get attendance records for the specified date (if provided)
    attendance_records = []
    if date_filter:
        attendance_records = db.query(EnhancedAttendance).filter(
            and_(
                EnhancedAttendance.department_code == department_code,
                EnhancedAttendance.semester == semester,
                EnhancedAttendance.section == section,
                EnhancedAttendance.subject_code == subject_code,
                EnhancedAttendance.date == date_filter
            )
        ).all()
    
    # Create attendance map
    attendance_map = {}
    for record in attendance_records:
        attendance_map[record.student_usn] = record.status
    
    # Prepare student list
    student_list = []
    for usn in student_usns:
        # Get student details if they exist in User table
        student_info = next((s for s in existing_students if s.user_id == usn), None)
        
        student_data = {
            "student_usn": usn,
            "name": student_info.full_name if student_info else f"Student {usn}",
            "email": student_info.email if student_info else None,
            "is_registered": usn in existing_usns
        }
        
        if date_filter:
            # Show attendance for specific date
            student_data["attendance_status"] = attendance_map.get(usn, "not_marked")
        else:
            # Show overall attendance summary
            summary = db.query(AttendanceSummary).filter(
                and_(
                    AttendanceSummary.student_usn == usn,
                    AttendanceSummary.subject_code == subject_code
                )
            ).first()
            
            if summary:
                student_data["total_classes"] = summary.total_classes
                student_data["present_count"] = summary.present_count
                student_data["attendance_percentage"] = summary.attendance_percentage
            else:
                student_data["total_classes"] = 0
                student_data["present_count"] = 0
                student_data["attendance_percentage"] = 0.0
        
        student_list.append(student_data)
    
    return {
        "department_code": department_code,
        "semester": semester,
        "section": section,
        "subject_code": subject_code,
        "professor": current_user.full_name,
        "date_filter": date_filter,
        "total_students": len(student_list),
        "registered_students": len(existing_students),
        "students": student_list
    }


# ==================== STUDENT DASHBOARD ====================

@router.get("/student/dashboard", response_model=StudentDashboard)
async def get_student_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get student dashboard with attendance and marks summary"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Parse USN to get student info (simplified)
    usn = current_user.user_id
    if len(usn) >= 10:
        department_code = usn[5:7]  # Extract department code from USN
        year_joined = int(usn[3:5])  # Extract year
        current_year = datetime.now().year % 100
        semester = ((current_year - year_joined) * 2) + (1 if datetime.now().month < 7 else 2)
        semester = min(max(semester, 1), 8)  # Clamp between 1 and 8
    else:
        department_code = "CS"
        semester = 1
    
    # Get attendance summary
    attendance_summaries = db.query(AttendanceSummary).filter(
        AttendanceSummary.student_usn == current_user.user_id
    ).all()
    
    # Get marks summary
    marks_summaries = db.query(MarksSummary).filter(
        MarksSummary.student_usn == current_user.user_id
    ).all()
    
    # Calculate overall statistics
    overall_attendance = 0.0
    if attendance_summaries:
        total_attendance = sum([s.attendance_percentage for s in attendance_summaries])
        overall_attendance = total_attendance / len(attendance_summaries)
    
    overall_percentage = 0.0
    if marks_summaries:
        total_percentage = sum([s.percentage for s in marks_summaries])
        overall_percentage = total_percentage / len(marks_summaries)
    
    return {
        "student_usn": current_user.user_id,
        "student_name": current_user.full_name,
        "department_code": department_code,
        "semester": semester,
        "section": "A",  # Default section
        "attendance_summary": attendance_summaries,
        "marks_summary": marks_summaries,
        "overall_attendance": round(overall_attendance, 2),
        "overall_percentage": round(overall_percentage, 2)
    }