"""
Enhanced Analytics routes with comprehensive insights and role-based access
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, text
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import calendar

from database import get_db
from models.models import (
    AttendanceModel, StudentMarks, User, Timetable, AttendanceSummary, 
    MarksSummary, NotificationModel
)
from schemas.schemas import (
    AttendanceSummaryResponse, MarksSummaryResponse
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin
from utils.usn_utils import (
    parse_usn, calculate_current_semester, get_department_name,
    calculate_grade, get_academic_year
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ============= STUDENT ANALYTICS =============

@router.get("/student/dashboard")
async def get_student_dashboard_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for student dashboard"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Parse USN to get student info
    parsed_usn = parse_usn(current_user.user_id)
    if not parsed_usn:
        raise HTTPException(status_code=400, detail="Invalid USN format")
    
    current_semester = calculate_current_semester(current_user.user_id)
    department_code = parsed_usn["department_code"]
    
    # Get attendance analytics
    attendance_data = await get_student_attendance_analytics(db, current_user.user_id)
    
    # Get marks analytics
    marks_data = await get_student_marks_analytics(db, current_user.user_id)
    
    # Get recent notifications count
    recent_notifications = db.query(Notification).filter(
        Notification.is_active == True,
        Notification.created_at >= datetime.now() - timedelta(days=7),
        or_(
            Notification.target_type == "global",
            and_(Notification.target_type == "department", Notification.target_value == department_code),
            and_(Notification.target_type == "semester", Notification.target_value == str(current_semester)),
            and_(Notification.target_type == "individual", Notification.target_value == current_user.user_id)
        )
    ).count()
    
    # Get unread notifications count
    read_notifications = db.query(NotificationRead.notification_id).filter(
        NotificationRead.student_usn == current_user.user_id
    ).all()
    read_ids = {r.notification_id for r in read_notifications}
    
    all_accessible_notifications = db.query(Notification.id).filter(
        Notification.is_active == True,
        or_(
            Notification.target_type == "global",
            and_(Notification.target_type == "department", Notification.target_value == department_code),
            and_(Notification.target_type == "semester", Notification.target_value == str(current_semester)),
            and_(Notification.target_type == "individual", Notification.target_value == current_user.user_id)
        )
    ).all()
    
    unread_count = len([n.id for n in all_accessible_notifications if n.id not in read_ids])
    
    # Get upcoming low attendance alerts
    low_attendance_subjects = [
        subject for subject in attendance_data["subject_wise_attendance"] 
        if subject["attendance_percentage"] < 75
    ]
    
    return {
        "student_info": {
            "usn": current_user.user_id,
            "name": current_user.full_name,
            "department_code": department_code,
            "department_name": get_department_name(department_code),
            "current_semester": current_semester,
            "academic_year": get_academic_year()
        },
        "attendance_summary": {
            "overall_percentage": attendance_data["overall_attendance_percentage"],
            "overall_status": get_attendance_status(attendance_data["overall_attendance_percentage"]),
            "total_subjects": len(attendance_data["subject_wise_attendance"]),
            "low_attendance_subjects": len(low_attendance_subjects)
        },
        "marks_summary": {
            "overall_percentage": marks_data["overall_percentage"],
            "overall_grade": get_grade_from_percentage(marks_data["overall_percentage"]),
            "total_subjects": len(marks_data["subject_wise_marks"]),
            "assessments_completed": sum(len(subject["assessments"]) for subject in marks_data["subject_wise_marks"])
        },
        "notifications_summary": {
            "recent_count": recent_notifications,
            "unread_count": unread_count
        },
        "alerts": {
            "low_attendance_subjects": [subject["subject_code"] for subject in low_attendance_subjects],
            "missing_assessments": []  # Can be implemented based on requirements
        }
    }


@router.get("/student/attendance-trends")
async def get_student_attendance_trends(
    months: int = Query(6, le=12),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get student attendance trends over time"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Get attendance records for the specified period
    start_date = datetime.now() - timedelta(days=months * 30)
    
    attendance_records = db.query(Attendance).filter(
        Attendance.student_usn == current_user.user_id,
        Attendance.date >= start_date.date()
    ).order_by(Attendance.date).all()
    
    # Group by month
    monthly_data = {}
    
    for record in attendance_records:
        month_key = f"{record.date.year}-{record.date.month:02d}"
        month_name = f"{calendar.month_name[record.date.month]} {record.date.year}"
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_name,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "attendance_percentage": 0.0
            }
        
        monthly_data[month_key]["total_classes"] += 1
        if record.status == "present":
            monthly_data[month_key]["present_count"] += 1
        elif record.status == "absent":
            monthly_data[month_key]["absent_count"] += 1
    
    # Calculate percentages
    for data in monthly_data.values():
        active_classes = data["present_count"] + data["absent_count"]
        data["attendance_percentage"] = calculate_attendance_percentage(
            data["present_count"], active_classes
        )
    
    # Sort by month
    sorted_data = sorted(monthly_data.values(), key=lambda x: x["month"])
    
    return {
        "student_usn": current_user.user_id,
        "period_months": months,
        "monthly_trends": sorted_data
    }


# ============= PROFESSOR ANALYTICS =============

@router.get("/professor/dashboard")
async def get_professor_dashboard_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for professor dashboard"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Get subjects taught by professor
    subjects = db.query(Subject).filter(
        Subject.professor_usn == current_user.user_id,
        Subject.is_active == True
    ).all()
    
    if not subjects:
        return {
            "professor_info": {
                "usn": current_user.user_id,
                "name": current_user.full_name
            },
            "message": "No subjects assigned"
        }
    
    # Calculate overall statistics
    total_students = 0
    total_classes_conducted = 0
    total_attendance_records = 0
    total_present = 0
    total_marks_records = 0
    total_marks_obtained = 0.0
    total_max_marks = 0.0
    
    subject_analytics = []
    
    for subject in subjects:
        # Get students for this subject
        subject_students = db.query(Student).filter(
            Student.department_code == subject.department_code,
            Student.current_semester == subject.semester,
            Student.is_active == True
        ).count()
        
        # Get attendance statistics
        attendance_records = db.query(Attendance).filter(
            Attendance.subject_code == subject.subject_code,
            Attendance.marked_by == current_user.user_id
        ).all()
        
        classes_conducted = len(set([r.date for r in attendance_records]))
        present_count = len([r for r in attendance_records if r.status == "present"])
        subject_attendance_percentage = calculate_attendance_percentage(
            present_count, len(attendance_records)
        )
        
        # Get marks statistics
        marks_records = db.query(InternalMarks).filter(
            InternalMarks.subject_code == subject.subject_code,
            InternalMarks.entered_by == current_user.user_id
        ).all()
        
        subject_marks_obtained = sum(r.obtained_marks for r in marks_records)
        subject_max_marks = sum(r.max_marks for r in marks_records)
        subject_marks_percentage = calculate_marks_percentage(subject_marks_obtained, subject_max_marks)
        
        subject_analytics.append({
            "subject_code": subject.subject_code,
            "subject_name": subject.name,
            "department_code": subject.department_code,
            "semester": subject.semester,
            "enrolled_students": subject_students,
            "classes_conducted": classes_conducted,
            "attendance_percentage": subject_attendance_percentage,
            "assessments_completed": len(set([(r.assessment_type, r.assessment_date) for r in marks_records])),
            "average_marks_percentage": subject_marks_percentage
        })
        
        # Add to totals
        total_students += subject_students
        total_classes_conducted += classes_conducted
        total_attendance_records += len(attendance_records)
        total_present += present_count
        total_marks_records += len(marks_records)
        total_marks_obtained += subject_marks_obtained
        total_max_marks += subject_max_marks
    
    # Calculate overall percentages
    overall_attendance = calculate_attendance_percentage(total_present, total_attendance_records)
    overall_marks = calculate_marks_percentage(total_marks_obtained, total_max_marks)
    
    return {
        "professor_info": {
            "usn": current_user.user_id,
            "name": current_user.full_name,
            "total_subjects": len(subjects)
        },
        "overall_statistics": {
            "total_students": total_students,
            "total_classes_conducted": total_classes_conducted,
            "overall_attendance_percentage": overall_attendance,
            "total_assessments": len(set([(r.subject_code, r.assessment_type, r.assessment_date) for r in db.query(InternalMarks).filter(InternalMarks.entered_by == current_user.user_id).all()])),
            "overall_marks_percentage": overall_marks
        },
        "subject_wise_analytics": subject_analytics
    }


@router.get("/professor/subject-performance/{subject_code}")
async def get_subject_performance_analytics(
    subject_code: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed performance analytics for a specific subject"""
    
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
    
    # Get all students for this subject
    students = db.query(Student).filter(
        Student.department_code == subject.department_code,
        Student.current_semester == subject.semester,
        Student.is_active == True
    ).all()
    
    student_performance = []
    
    for student in students:
        # Get attendance data
        attendance_records = db.query(Attendance).filter(
            Attendance.student_usn == student.usn,
            Attendance.subject_code == subject_code
        ).all()
        
        total_classes = len(attendance_records)
        present_count = len([r for r in attendance_records if r.status == "present"])
        attendance_percentage = calculate_attendance_percentage(present_count, total_classes)
        
        # Get marks data
        marks_records = db.query(InternalMarks).filter(
            InternalMarks.student_usn == student.usn,
            InternalMarks.subject_code == subject_code
        ).all()
        
        total_marks_obtained = sum(r.obtained_marks for r in marks_records)
        total_max_marks = sum(r.max_marks for r in marks_records)
        marks_percentage = calculate_marks_percentage(total_marks_obtained, total_max_marks)
        
        student_performance.append({
            "usn": student.usn,
            "name": student.full_name,
            "roll_number": student.roll_number,
            "attendance": {
                "total_classes": total_classes,
                "present_count": present_count,
                "attendance_percentage": attendance_percentage,
                "status": get_attendance_status(attendance_percentage)
            },
            "marks": {
                "total_assessments": len(marks_records),
                "total_marks_obtained": total_marks_obtained,
                "total_max_marks": total_max_marks,
                "marks_percentage": marks_percentage,
                "grade": get_grade_from_percentage(marks_percentage)
            }
        })
    
    # Calculate class statistics
    if student_performance:
        avg_attendance = sum(s["attendance"]["attendance_percentage"] for s in student_performance) / len(student_performance)
        avg_marks = sum(s["marks"]["marks_percentage"] for s in student_performance) / len(student_performance)
        
        # Top performers
        top_attendance = sorted(student_performance, key=lambda x: x["attendance"]["attendance_percentage"], reverse=True)[:3]
        top_marks = sorted(student_performance, key=lambda x: x["marks"]["marks_percentage"], reverse=True)[:3]
    else:
        avg_attendance = 0
        avg_marks = 0
        top_attendance = []
        top_marks = []
    
    return {
        "subject_info": {
            "subject_code": subject.subject_code,
            "subject_name": subject.name,
            "department_code": subject.department_code,
            "semester": subject.semester
        },
        "class_statistics": {
            "total_students": len(student_performance),
            "average_attendance": round(avg_attendance, 2),
            "average_marks": round(avg_marks, 2)
        },
        "top_performers": {
            "attendance": [{"usn": s["usn"], "name": s["name"], "percentage": s["attendance"]["attendance_percentage"]} for s in top_attendance],
            "marks": [{"usn": s["usn"], "name": s["name"], "percentage": s["marks"]["marks_percentage"]} for s in top_marks]
        },
        "student_performance": student_performance
    }


# ============= ADMIN ANALYTICS =============

@router.get("/admin/system-overview")
async def get_system_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive system overview for admin dashboard"""
    
    # Get basic counts
    total_students = db.query(User).filter(User.role == "student", User.is_active == True).count()
    total_professors = db.query(User).filter(User.role == "professor", User.is_active == True).count()
    total_subjects = db.query(SubjectMaster).filter(SubjectMaster.is_active == True).count()
    
    # Get department-wise statistics
    departments = db.query(Student.department_code, func.count(Student.id).label('student_count')).filter(
        Student.is_active == True
    ).group_by(Student.department_code).all()
    
    department_stats = []
    for dept_code, student_count in departments:
        # Get average attendance for department
        dept_attendance = db.query(Attendance).join(Student).filter(
            Student.department_code == dept_code,
            Student.is_active == True
        ).all()
        
        if dept_attendance:
            present_count = len([r for r in dept_attendance if r.status == "present"])
            dept_attendance_percentage = calculate_attendance_percentage(present_count, len(dept_attendance))
        else:
            dept_attendance_percentage = 0.0
        
        # Get average marks for department
        dept_marks = db.query(InternalMarks).join(Student).filter(
            Student.department_code == dept_code,
            Student.is_active == True
        ).all()
        
        if dept_marks:
            total_obtained = sum(r.obtained_marks for r in dept_marks)
            total_max = sum(r.max_marks for r in dept_marks)
            dept_marks_percentage = calculate_marks_percentage(total_obtained, total_max)
        else:
            dept_marks_percentage = 0.0
        
        department_stats.append({
            "department_code": dept_code,
            "department_name": get_department_name(dept_code),
            "student_count": student_count,
            "average_attendance": dept_attendance_percentage,
            "average_marks": dept_marks_percentage
        })
    
    # Get recent activity
    recent_attendance = db.query(Attendance).filter(
        Attendance.marked_at >= datetime.now() - timedelta(days=7)
    ).count()
    
    recent_marks = db.query(InternalMarks).filter(
        InternalMarks.entered_at >= datetime.now() - timedelta(days=7)
    ).count()
    
    recent_notifications = db.query(Notification).filter(
        Notification.created_at >= datetime.now() - timedelta(days=7)
    ).count()
    
    # Get top performers (overall)
    student_performance = []
    for student in db.query(Student).filter(Student.is_active == True).limit(100).all():
        # Get attendance percentage
        attendance_records = db.query(Attendance).filter(Attendance.student_usn == student.usn).all()
        if attendance_records:
            present_count = len([r for r in attendance_records if r.status == "present"])
            attendance_percentage = calculate_attendance_percentage(present_count, len(attendance_records))
        else:
            attendance_percentage = 0.0
        
        # Get marks percentage
        marks_records = db.query(InternalMarks).filter(InternalMarks.student_usn == student.usn).all()
        if marks_records:
            total_obtained = sum(r.obtained_marks for r in marks_records)
            total_max = sum(r.max_marks for r in marks_records)
            marks_percentage = calculate_marks_percentage(total_obtained, total_max)
        else:
            marks_percentage = 0.0
        
        if marks_percentage > 0:  # Only include students with marks
            student_performance.append({
                "usn": student.usn,
                "name": student.full_name,
                "department_code": student.department_code,
                "semester": student.current_semester,
                "attendance_percentage": attendance_percentage,
                "marks_percentage": marks_percentage,
                "overall_score": (attendance_percentage + marks_percentage) / 2
            })
    
    # Sort by overall score and get top 10
    top_performers = sorted(student_performance, key=lambda x: x["overall_score"], reverse=True)[:10]
    
    return {
        "system_statistics": {
            "total_students": total_students,
            "total_professors": total_professors,
            "total_subjects": total_subjects,
            "total_departments": len(department_stats)
        },
        "recent_activity": {
            "attendance_records_week": recent_attendance,
            "marks_entries_week": recent_marks,
            "notifications_week": recent_notifications
        },
        "department_statistics": department_stats,
        "top_performers": top_performers
    }


@router.get("/admin/department-comparison")
async def get_department_comparison(
    metric: str = Query("attendance", regex="^(attendance|marks|both)$"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comparative analytics across departments"""
    
    departments = db.query(Student.department_code).filter(Student.is_active == True).distinct().all()
    department_comparison = []
    
    for (dept_code,) in departments:
        dept_students = db.query(Student).filter(
            Student.department_code == dept_code,
            Student.is_active == True
        ).all()
        
        student_usns = [s.usn for s in dept_students]
        
        dept_data = {
            "department_code": dept_code,
            "department_name": get_department_name(dept_code),
            "total_students": len(dept_students)
        }
        
        if metric in ["attendance", "both"]:
            # Calculate department attendance
            attendance_records = db.query(Attendance).filter(
                Attendance.student_usn.in_(student_usns)
            ).all()
            
            if attendance_records:
                present_count = len([r for r in attendance_records if r.status == "present"])
                dept_data["attendance_percentage"] = calculate_attendance_percentage(
                    present_count, len(attendance_records)
                )
                dept_data["total_classes"] = len(attendance_records)
            else:
                dept_data["attendance_percentage"] = 0.0
                dept_data["total_classes"] = 0
        
        if metric in ["marks", "both"]:
            # Calculate department marks
            marks_records = db.query(InternalMarks).filter(
                InternalMarks.student_usn.in_(student_usns)
            ).all()
            
            if marks_records:
                total_obtained = sum(r.obtained_marks for r in marks_records)
                total_max = sum(r.max_marks for r in marks_records)
                dept_data["marks_percentage"] = calculate_marks_percentage(total_obtained, total_max)
                dept_data["total_assessments"] = len(marks_records)
            else:
                dept_data["marks_percentage"] = 0.0
                dept_data["total_assessments"] = 0
        
        department_comparison.append(dept_data)
    
    # Sort by the requested metric
    if metric == "attendance":
        department_comparison.sort(key=lambda x: x.get("attendance_percentage", 0), reverse=True)
    elif metric == "marks":
        department_comparison.sort(key=lambda x: x.get("marks_percentage", 0), reverse=True)
    else:  # both
        department_comparison.sort(
            key=lambda x: (x.get("attendance_percentage", 0) + x.get("marks_percentage", 0)) / 2, 
            reverse=True
        )
    
    return {
        "comparison_metric": metric,
        "total_departments": len(department_comparison),
        "department_rankings": department_comparison
    }


# ============= UTILITY FUNCTIONS =============

async def get_student_attendance_analytics(db: Session, student_usn: str) -> Dict[str, Any]:
    """Get comprehensive attendance analytics for a student"""
    
    attendance_records = db.query(Attendance).filter(
        Attendance.student_usn == student_usn
    ).all()
    
    if not attendance_records:
        return {
            "overall_attendance_percentage": 0.0,
            "subject_wise_attendance": [],
            "monthly_trends": []
        }
    
    # Group by subject
    subject_wise = {}
    for record in attendance_records:
        if record.subject_code not in subject_wise:
            subject_wise[record.subject_code] = {
                "subject_code": record.subject_code,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "attendance_percentage": 0.0
            }
        
        subject_data = subject_wise[record.subject_code]
        subject_data["total_classes"] += 1
        
        if record.status == "present":
            subject_data["present_count"] += 1
        elif record.status == "absent":
            subject_data["absent_count"] += 1
    
    # Calculate percentages
    for subject_data in subject_wise.values():
        active_classes = subject_data["present_count"] + subject_data["absent_count"]
        subject_data["attendance_percentage"] = calculate_attendance_percentage(
            subject_data["present_count"], active_classes
        )
    
    # Calculate overall percentage
    total_present = sum(s["present_count"] for s in subject_wise.values())
    total_classes = sum(s["present_count"] + s["absent_count"] for s in subject_wise.values())
    overall_percentage = calculate_attendance_percentage(total_present, total_classes)
    
    return {
        "overall_attendance_percentage": overall_percentage,
        "subject_wise_attendance": list(subject_wise.values()),
        "monthly_trends": []  # Can be implemented if needed
    }


async def get_student_marks_analytics(db: Session, student_usn: str) -> Dict[str, Any]:
    """Get comprehensive marks analytics for a student"""
    
    marks_records = db.query(InternalMarks).filter(
        InternalMarks.student_usn == student_usn
    ).all()
    
    if not marks_records:
        return {
            "overall_percentage": 0.0,
            "subject_wise_marks": [],
            "assessment_wise_performance": {}
        }
    
    # Group by subject
    subject_wise = {}
    assessment_wise = {}
    
    for record in marks_records:
        # Subject-wise grouping
        if record.subject_code not in subject_wise:
            subject_wise[record.subject_code] = {
                "subject_code": record.subject_code,
                "assessments": [],
                "total_obtained": 0.0,
                "total_max": 0.0,
                "percentage": 0.0
            }
        
        subject_data = subject_wise[record.subject_code]
        percentage = calculate_marks_percentage(record.obtained_marks, record.max_marks)
        
        subject_data["assessments"].append({
            "assessment_type": record.assessment_type,
            "obtained_marks": record.obtained_marks,
            "max_marks": record.max_marks,
            "percentage": percentage,
            "assessment_date": record.assessment_date
        })
        
        subject_data["total_obtained"] += record.obtained_marks
        subject_data["total_max"] += record.max_marks
        
        # Assessment-wise grouping
        if record.assessment_type not in assessment_wise:
            assessment_wise[record.assessment_type] = {
                "total_obtained": 0.0,
                "total_max": 0.0,
                "count": 0,
                "average_percentage": 0.0
            }
        
        assessment_data = assessment_wise[record.assessment_type]
        assessment_data["total_obtained"] += record.obtained_marks
        assessment_data["total_max"] += record.max_marks
        assessment_data["count"] += 1
    
    # Calculate percentages
    for subject_data in subject_wise.values():
        subject_data["percentage"] = calculate_marks_percentage(
            subject_data["total_obtained"], subject_data["total_max"]
        )
    
    for assessment_data in assessment_wise.values():
        assessment_data["average_percentage"] = calculate_marks_percentage(
            assessment_data["total_obtained"], assessment_data["total_max"]
        )
    
    # Calculate overall percentage
    total_obtained = sum(s["total_obtained"] for s in subject_wise.values())
    total_max = sum(s["total_max"] for s in subject_wise.values())
    overall_percentage = calculate_marks_percentage(total_obtained, total_max)
    
    return {
        "overall_percentage": overall_percentage,
        "subject_wise_marks": list(subject_wise.values()),
        "assessment_wise_performance": assessment_wise
    }