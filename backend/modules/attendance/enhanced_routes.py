"""
Enhanced Attendance routes with complete role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from database import get_db
from models.models import AttendanceModel, User, Timetable, StudentRegistry, SubjectMaster
from schemas.schemas import (
    AttendanceResponse, AttendanceCreate, BulkAttendanceCreate, AttendanceStats
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin
from utils.usn_utils import (
    parse_usn, calculate_current_semester, get_academic_year,
    get_department_name
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


# ============= PROFESSOR ENDPOINTS =============

@router.get("/professor/my-subjects")
async def get_professor_subjects(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get subjects assigned to the current professor"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Get subjects assigned to this professor
    subjects = db.query(Subject).filter(
        Subject.professor_usn == current_user.user_id,
        Subject.is_active == True
    ).all()
    
    if not subjects:
        return {
            "professor_usn": current_user.user_id,
            "professor_name": current_user.full_name,
            "assigned_subjects": [],
            "message": "No subjects assigned to this professor"
        }
    
    # Get timetable info for each subject
    subject_data = []
    for subject in subjects:
        # Get timetable entries for this subject
        timetable_entries = db.query(EnhancedTimetable).filter(
            EnhancedTimetable.subject_code == subject.subject_code,
            EnhancedTimetable.professor_usn == current_user.user_id
        ).all()
        
        # Get student count for this subject (based on department and semester)
        student_count = db.query(Student).filter(
            Student.department_code == subject.department_code,
            Student.current_semester == subject.semester,
            Student.is_active == True
        ).count()
        
        # Get attendance statistics
        total_classes = db.query(Attendance).filter(
            Attendance.subject_code == subject.subject_code,
            Attendance.marked_by == current_user.user_id
        ).count()
        
        subject_info = {
            "subject_code": subject.subject_code,
            "subject_name": subject.name,
            "department_code": subject.department_code,
            "department_name": get_department_name(subject.department_code),
            "semester": subject.semester,
            "credits": subject.credits,
            "student_count": student_count,
            "total_classes_conducted": total_classes,
            "schedule": [
                {
                    "day": entry.day,
                    "period_start": entry.period_start,
                    "period_end": entry.period_end,
                    "room_number": entry.room_number,
                    "is_cancelled": entry.is_cancelled,
                    "cancel_reason": entry.cancel_reason
                }
                for entry in timetable_entries
            ]
        }
        subject_data.append(subject_info)
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "assigned_subjects": subject_data
    }


@router.get("/professor/subject-students/{subject_code}")
async def get_subject_students(
    subject_code: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get students enrolled in a specific subject"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Verify professor is assigned to this subject
    subject = db.query(Subject).filter(
        Subject.subject_code == subject_code,
        Subject.professor_usn == current_user.user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=403,
            detail=f"You are not assigned to teach subject {subject_code}"
        )
    
    # Get students for this subject (based on department and semester)
    students = db.query(Student).filter(
        Student.department_code == subject.department_code,
        Student.current_semester == subject.semester,
        Student.is_active == True
    ).order_by(Student.usn).all()
    
    # Get attendance statistics for each student
    student_data = []
    for student in students:
        # Get attendance records for this student and subject
        attendance_records = db.query(Attendance).filter(
            Attendance.student_usn == student.usn,
            Attendance.subject_code == subject_code
        ).all()
        
        total_classes = len(attendance_records)
        present_count = len([r for r in attendance_records if r.status == "present"])
        absent_count = len([r for r in attendance_records if r.status == "absent"])
        
        attendance_percentage = calculate_attendance_percentage(present_count, total_classes)
        
        student_info = {
            "usn": student.usn,
            "full_name": student.full_name,
            "email": student.email,
            "roll_number": student.roll_number,
            "total_classes": total_classes,
            "classes_attended": present_count,
            "classes_missed": absent_count,
            "attendance_percentage": attendance_percentage,
            "attendance_status": get_attendance_status(attendance_percentage)
        }
        student_data.append(student_info)
    
    return {
        "subject_code": subject_code,
        "subject_name": subject.name,
        "department_code": subject.department_code,
        "semester": subject.semester,
        "total_students": len(student_data),
        "students": student_data
    }


@router.post("/professor/mark-attendance")
async def mark_attendance(
    attendance_data: BulkAttendanceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark attendance for multiple students in a class"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can mark attendance")
    
    # Verify professor is assigned to this subject
    subject = db.query(Subject).filter(
        Subject.subject_code == attendance_data.subject_code,
        Subject.professor_usn == current_user.user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=403,
            detail=f"You are not assigned to teach subject {attendance_data.subject_code}"
        )
    
    created_records = []
    errors = []
    
    for i, record in enumerate(attendance_data.attendance_records):
        try:
            student_usn = record.get("student_usn")
            status = record.get("status", "present")
            
            if not student_usn:
                errors.append({
                    "index": i,
                    "student_usn": student_usn,
                    "error": "Student USN is required"
                })
                continue
            
            # Check if student exists and is in the correct department/semester
            student = db.query(Student).filter(
                Student.usn == student_usn,
                Student.department_code == subject.department_code,
                Student.current_semester == subject.semester,
                Student.is_active == True
            ).first()
            
            if not student:
                errors.append({
                    "index": i,
                    "student_usn": student_usn,
                    "error": "Student not found or not enrolled in this subject"
                })
                continue
            
            # Check if attendance already marked for this date
            existing = db.query(Attendance).filter(
                Attendance.student_usn == student_usn,
                Attendance.subject_code == attendance_data.subject_code,
                Attendance.date == attendance_data.date
            ).first()
            
            if existing:
                # Update existing record
                existing.status = status
                existing.marked_by = current_user.user_id
                existing.marked_at = datetime.now()
                existing.period_start = attendance_data.period_start
                existing.period_end = attendance_data.period_end
                existing.room_number = attendance_data.room_number
                
                created_records.append({
                    "student_usn": student_usn,
                    "status": status,
                    "action": "updated"
                })
            else:
                # Create new record
                new_attendance = Attendance(
                    student_usn=student_usn,
                    subject_code=attendance_data.subject_code,
                    date=attendance_data.date,
                    status=status,
                    period_start=attendance_data.period_start,
                    period_end=attendance_data.period_end,
                    room_number=attendance_data.room_number,
                    marked_by=current_user.user_id
                )
                
                db.add(new_attendance)
                created_records.append({
                    "student_usn": student_usn,
                    "status": status,
                    "action": "created"
                })
                
        except Exception as e:
            errors.append({
                "index": i,
                "student_usn": record.get("student_usn"),
                "error": str(e)
            })
    
    if created_records:
        db.commit()
        
        # Update attendance analytics
        await update_attendance_analytics(db, attendance_data.subject_code, attendance_data.date)
    
    return {
        "subject_code": attendance_data.subject_code,
        "date": attendance_data.date,
        "processed_count": len(created_records),
        "error_count": len(errors),
        "records": created_records,
        "errors": errors
    }


@router.get("/professor/attendance-report/{subject_code}")
async def get_attendance_report(
    subject_code: str,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed attendance report for a subject"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Verify professor is assigned to this subject
    subject = db.query(Subject).filter(
        Subject.subject_code == subject_code,
        Subject.professor_usn == current_user.user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=403,
            detail=f"You are not assigned to teach subject {subject_code}"
        )
    
    # Build query
    query = db.query(Attendance).filter(Attendance.subject_code == subject_code)
    
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    
    attendance_records = query.order_by(Attendance.date.desc(), Attendance.student_usn).all()
    
    # Group by student
    student_attendance = {}
    class_dates = set()
    
    for record in attendance_records:
        class_dates.add(record.date)
        
        if record.student_usn not in student_attendance:
            student_attendance[record.student_usn] = {
                "student_usn": record.student_usn,
                "records": [],
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "attendance_percentage": 0.0
            }
        
        student_data = student_attendance[record.student_usn]
        student_data["records"].append({
            "date": record.date,
            "status": record.status,
            "period_start": record.period_start,
            "period_end": record.period_end
        })
        
        student_data["total_classes"] += 1
        if record.status == "present":
            student_data["present_count"] += 1
        elif record.status == "absent":
            student_data["absent_count"] += 1
    
    # Calculate percentages and add student info
    for usn, data in student_attendance.items():
        data["attendance_percentage"] = calculate_attendance_percentage(
            data["present_count"], data["total_classes"]
        )
        
        # Get student info
        student = db.query(Student).filter(Student.usn == usn).first()
        if student:
            data["student_name"] = student.full_name
            data["roll_number"] = student.roll_number
    
    return {
        "subject_code": subject_code,
        "subject_name": subject.name,
        "date_range": {
            "from": date_from,
            "to": date_to
        },
        "total_classes_conducted": len(class_dates),
        "total_students": len(student_attendance),
        "class_dates": sorted(list(class_dates)),
        "student_attendance": list(student_attendance.values())
    }


# ============= STUDENT ENDPOINTS =============

@router.get("/student/my-attendance")
async def get_my_attendance(
    subject_code: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current student's attendance records"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Parse USN to get student info
    parsed_usn = parse_usn(current_user.user_id)
    if not parsed_usn:
        raise HTTPException(status_code=400, detail="Invalid USN format")
    
    current_semester = calculate_current_semester(current_user.user_id)
    
    # Build query
    query = db.query(Attendance).filter(Attendance.student_usn == current_user.user_id)
    
    if subject_code:
        query = query.filter(Attendance.subject_code == subject_code)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    
    attendance_records = query.order_by(Attendance.date.desc()).all()
    
    # Group by subject
    subject_wise_data = {}
    
    for record in attendance_records:
        if record.subject_code not in subject_wise_data:
            # Get subject info
            subject = db.query(Subject).filter(Subject.subject_code == record.subject_code).first()
            subject_name = subject.name if subject else "Unknown Subject"
            
            subject_wise_data[record.subject_code] = {
                "subject_code": record.subject_code,
                "subject_name": subject_name,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "cancelled_count": 0,
                "attendance_percentage": 0.0,
                "attendance_status": "N/A",
                "records": []
            }
        
        subject_data = subject_wise_data[record.subject_code]
        subject_data["total_classes"] += 1
        
        if record.status == "present":
            subject_data["present_count"] += 1
        elif record.status == "absent":
            subject_data["absent_count"] += 1
        elif record.status == "cancelled":
            subject_data["cancelled_count"] += 1
        
        subject_data["records"].append({
            "date": record.date,
            "status": record.status,
            "period_start": record.period_start,
            "period_end": record.period_end,
            "room_number": record.room_number,
            "marked_by": record.marked_by
        })
    
    # Calculate percentages
    for subject_data in subject_wise_data.values():
        active_classes = subject_data["present_count"] + subject_data["absent_count"]
        subject_data["attendance_percentage"] = calculate_attendance_percentage(
            subject_data["present_count"], active_classes
        )
        subject_data["attendance_status"] = get_attendance_status(subject_data["attendance_percentage"])
    
    # Calculate overall statistics
    total_classes = sum(data["total_classes"] for data in subject_wise_data.values())
    total_present = sum(data["present_count"] for data in subject_wise_data.values())
    total_absent = sum(data["absent_count"] for data in subject_wise_data.values())
    overall_percentage = calculate_attendance_percentage(total_present, total_present + total_absent)
    
    return {
        "student_usn": current_user.user_id,
        "student_name": current_user.full_name,
        "department_code": parsed_usn["department_code"],
        "current_semester": current_semester,
        "overall_statistics": {
            "total_classes": total_classes,
            "total_present": total_present,
            "total_absent": total_absent,
            "overall_percentage": overall_percentage,
            "overall_status": get_attendance_status(overall_percentage)
        },
        "subject_wise_attendance": list(subject_wise_data.values())
    }


# ============= ADMIN ENDPOINTS =============

@router.get("/admin/department-report/{department_code}")
async def get_department_attendance_report(
    department_code: str,
    semester: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive attendance report for a department"""
    
    # Build student query
    student_query = db.query(Student).filter(
        Student.department_code == department_code,
        Student.is_active == True
    )
    
    if semester:
        student_query = student_query.filter(Student.current_semester == semester)
    
    students = student_query.all()
    student_usns = [s.usn for s in students]
    
    if not student_usns:
        return {
            "department_code": department_code,
            "department_name": get_department_name(department_code),
            "message": "No students found for the specified criteria"
        }
    
    # Build attendance query
    attendance_query = db.query(Attendance).filter(Attendance.student_usn.in_(student_usns))
    
    if date_from:
        attendance_query = attendance_query.filter(Attendance.date >= date_from)
    if date_to:
        attendance_query = attendance_query.filter(Attendance.date <= date_to)
    
    attendance_records = attendance_query.all()
    
    # Process data
    student_stats = {}
    subject_stats = {}
    
    for record in attendance_records:
        # Student statistics
        if record.student_usn not in student_stats:
            student = next((s for s in students if s.usn == record.student_usn), None)
            student_stats[record.student_usn] = {
                "usn": record.student_usn,
                "name": student.full_name if student else "Unknown",
                "semester": student.current_semester if student else 0,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "attendance_percentage": 0.0
            }
        
        student_data = student_stats[record.student_usn]
        student_data["total_classes"] += 1
        
        if record.status == "present":
            student_data["present_count"] += 1
        elif record.status == "absent":
            student_data["absent_count"] += 1
        
        # Subject statistics
        if record.subject_code not in subject_stats:
            subject = db.query(Subject).filter(Subject.subject_code == record.subject_code).first()
            subject_stats[record.subject_code] = {
                "subject_code": record.subject_code,
                "subject_name": subject.name if subject else "Unknown",
                "total_classes": 0,
                "total_present": 0,
                "total_absent": 0,
                "average_attendance": 0.0
            }
        
        subject_data = subject_stats[record.subject_code]
        subject_data["total_classes"] += 1
        
        if record.status == "present":
            subject_data["total_present"] += 1
        elif record.status == "absent":
            subject_data["total_absent"] += 1
    
    # Calculate percentages
    for student_data in student_stats.values():
        active_classes = student_data["present_count"] + student_data["absent_count"]
        student_data["attendance_percentage"] = calculate_attendance_percentage(
            student_data["present_count"], active_classes
        )
    
    for subject_data in subject_stats.values():
        active_classes = subject_data["total_present"] + subject_data["total_absent"]
        subject_data["average_attendance"] = calculate_attendance_percentage(
            subject_data["total_present"], active_classes
        )
    
    # Overall statistics
    total_classes = sum(s["total_classes"] for s in student_stats.values())
    total_present = sum(s["present_count"] for s in student_stats.values())
    total_absent = sum(s["absent_count"] for s in student_stats.values())
    department_average = calculate_attendance_percentage(total_present, total_present + total_absent)
    
    return {
        "department_code": department_code,
        "department_name": get_department_name(department_code),
        "semester_filter": semester,
        "date_range": {"from": date_from, "to": date_to},
        "overall_statistics": {
            "total_students": len(student_stats),
            "total_classes": total_classes,
            "department_average_attendance": department_average,
            "total_subjects": len(subject_stats)
        },
        "student_wise_report": list(student_stats.values()),
        "subject_wise_report": list(subject_stats.values())
    }


# ============= UTILITY FUNCTIONS =============

async def update_attendance_analytics(db: Session, subject_code: str, attendance_date: date):
    """Update attendance analytics after marking attendance"""
    try:
        # Get all students who have attendance for this subject
        student_usns = db.query(Attendance.student_usn).filter(
            Attendance.subject_code == subject_code
        ).distinct().all()
        
        for (student_usn,) in student_usns:
            # Calculate statistics for this student and subject
            records = db.query(Attendance).filter(
                Attendance.student_usn == student_usn,
                Attendance.subject_code == subject_code
            ).all()
            
            total_classes = len(records)
            present_count = len([r for r in records if r.status == "present"])
            absent_count = len([r for r in records if r.status == "absent"])
            attendance_percentage = calculate_attendance_percentage(present_count, total_classes)
            
            # Update or create analytics record
            analytics = db.query(AttendanceAnalytics).filter(
                AttendanceAnalytics.student_usn == student_usn,
                AttendanceAnalytics.subject_code == subject_code,
                AttendanceAnalytics.month == attendance_date.month,
                AttendanceAnalytics.year == attendance_date.year
            ).first()
            
            if analytics:
                analytics.total_classes = total_classes
                analytics.classes_attended = present_count
                analytics.classes_missed = absent_count
                analytics.attendance_percentage = attendance_percentage
                analytics.last_updated = datetime.now()
            else:
                analytics = AttendanceAnalytics(
                    student_usn=student_usn,
                    subject_code=subject_code,
                    total_classes=total_classes,
                    classes_attended=present_count,
                    classes_missed=absent_count,
                    attendance_percentage=attendance_percentage,
                    month=attendance_date.month,
                    year=attendance_date.year
                )
                db.add(analytics)
        
        db.commit()
        
    except Exception as e:
        print(f"Error updating attendance analytics: {e}")
        db.rollback()