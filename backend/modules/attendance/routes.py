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
from .schemas import AttendanceResponse, AttendanceCreate, AttendanceUpdate, BulkAttendanceCreate, AttendanceStats
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin
from modules.auth.models import User

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance_records(
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    usn: Optional[str] = Query(None, description="Filter by student USN"),
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
        query = query.filter(AttendanceModel.usn == current_user.user_id)
    elif current_user.role == "professor":
        # Professors can see attendance for all classes (they teach multiple classes)
        pass  # No additional filtering needed for professors
    # Admins can see all records
    
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    if usn and current_user.role in ["professor", "admin"]:
        query = query.filter(AttendanceModel.usn == usn)
    if status:
        query = query.filter(AttendanceModel.status == status)
    if date_from:
        query = query.filter(AttendanceModel.date >= date_from)
    if date_to:
        query = query.filter(AttendanceModel.date <= date_to)
    
    records = query.order_by(AttendanceModel.date.desc(), AttendanceModel.usn).limit(limit).all()
    return records

@router.post("/", response_model=AttendanceResponse)
async def create_attendance_record(
    attendance: AttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a single attendance record - professors and admins only"""
    # Validate professor can only mark attendance for their assigned classes
    if current_user.role == "professor":
        # Import here to avoid circular imports
        from modules.timetable.models import Timetable
        
        # Check if professor is assigned to this class
        professor_class = db.query(Timetable).filter(
            and_(
                Timetable.class_id == attendance.class_id,
                Timetable.professor_usn == current_user.user_id
            )
        ).first()
        
        if not professor_class:
            raise HTTPException(
                status_code=403,
                detail="Professors can only mark attendance for their assigned classes"
            )
    
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

@router.post("/bulk")
async def create_bulk_attendance(
    bulk_data: BulkAttendanceCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create multiple attendance records at once - professors and admins only"""
    # Validate professor can only mark attendance for their assigned classes
    if current_user.role == "professor":
        from modules.timetable.models import Timetable
        
        professor_class = db.query(Timetable).filter(
            and_(
                Timetable.class_id == bulk_data.class_id,
                Timetable.professor_usn == current_user.user_id
            )
        ).first()
        
        if not professor_class:
            raise HTTPException(
                status_code=403,
                detail="Professors can only mark attendance for their assigned classes"
            )
    
    created_records = []
    errors = []
    
    for i, record in enumerate(bulk_data.attendance_records):
        try:
            usn = record.get("usn")
            status = record.get("status", "present")
            
            if not usn:
                errors.append({
                    "index": i,
                    "error": "USN is required"
                })
                continue
            
            # Check if record already exists
            existing = db.query(AttendanceModel).filter(
                and_(
                    AttendanceModel.class_id == bulk_data.class_id,
                    AttendanceModel.usn == usn,
                    AttendanceModel.date == bulk_data.date
                )
            ).first()
            
            if existing:
                errors.append({
                    "index": i,
                    "error": f"Record already exists for {usn} on {bulk_data.date}"
                })
                continue
            
            # Create attendance record
            attendance_data = {
                "class_id": bulk_data.class_id,
                "usn": usn,
                "date": bulk_data.date,
                "status": status,
                "marked_by": current_user.user_id,
                "period_start": bulk_data.period_start,
                "period_end": bulk_data.period_end,
                "subject": bulk_data.subject
            }
            
            db_attendance = AttendanceModel(**attendance_data)
            db.add(db_attendance)
            created_records.append(attendance_data)
            
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


@router.get("/stats/class/{class_id}", response_model=AttendanceStats)
async def get_class_attendance_stats(
    class_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get attendance statistics for a specific class"""
    records = db.query(AttendanceModel).filter(AttendanceModel.class_id == class_id).all()
    
    if not records:
        return AttendanceStats(
            total_records=0,
            present_count=0,
            absent_count=0,
            cancelled_count=0,
            attendance_rate=0.0,
            active_records=0,
            unique_students=0
        )
    
    total_records = len(records)
    present_count = len([r for r in records if r.status == "present"])
    absent_count = len([r for r in records if r.status == "absent"])
    cancelled_count = len([r for r in records if r.status == "cancelled"])
    
    # Calculate attendance rate excluding cancelled classes
    active_records = present_count + absent_count
    attendance_rate = (present_count / active_records * 100) if active_records > 0 else 0.0
    
    unique_students = len(set([r.usn for r in records]))
    
    return AttendanceStats(
        total_records=total_records,
        present_count=present_count,
        absent_count=absent_count,
        cancelled_count=cancelled_count,
        attendance_rate=round(attendance_rate, 2),
        active_records=active_records,
        unique_students=unique_students
    )


@router.get("/stats/student/{usn}", response_model=AttendanceStats)
async def get_student_attendance_stats(
    usn: str,
    class_id: Optional[str] = Query(None, description="Filter by specific class"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get attendance statistics for a specific student"""
    # Students can only see their own stats
    if current_user.role == "student" and current_user.user_id != usn:
        raise HTTPException(status_code=403, detail="Students can only view their own attendance stats")
    
    query = db.query(AttendanceModel).filter(AttendanceModel.usn == usn)
    
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    
    records = query.all()
    
    if not records:
        return AttendanceStats(
            total_records=0,
            present_count=0,
            absent_count=0,
            cancelled_count=0,
            attendance_rate=0.0,
            active_records=0,
            classes=[]
        )
    
    total_records = len(records)
    present_count = len([r for r in records if r.status == "present"])
    absent_count = len([r for r in records if r.status == "absent"])
    cancelled_count = len([r for r in records if r.status == "cancelled"])
    
    # Calculate attendance rate excluding cancelled classes
    active_records = present_count + absent_count
    attendance_rate = (present_count / active_records * 100) if active_records > 0 else 0.0
    
    classes = list(set([r.class_id for r in records]))
    
    return AttendanceStats(
        total_records=total_records,
        present_count=present_count,
        absent_count=absent_count,
        cancelled_count=cancelled_count,
        attendance_rate=round(attendance_rate, 2),
        active_records=active_records,
        classes=classes
    )


@router.get("/professor/subjects")
async def get_professor_subjects(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get subjects assigned to the current professor"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    from modules.timetable.models import Timetable
    
    # Get all subjects assigned to this professor
    professor_subjects = db.query(Timetable).filter(
        Timetable.professor_usn == current_user.user_id
    ).all()
    
    # Group by class_id and subject
    subjects_data = {}
    for entry in professor_subjects:
        if entry.class_id not in subjects_data:
            subjects_data[entry.class_id] = {
                "class_id": entry.class_id,
                "subjects": set(),
                "days": [],
                "periods": []
            }
        
        subjects_data[entry.class_id]["subjects"].add(entry.subject)
        subjects_data[entry.class_id]["days"].append({
            "day": entry.day,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "subject": entry.subject
        })
    
    # Convert sets to lists for JSON serialization
    for class_data in subjects_data.values():
        class_data["subjects"] = list(class_data["subjects"])
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "assigned_classes": list(subjects_data.values())
    }


@router.get("/student/subjects/{usn}")
async def get_student_subjects(
    usn: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all subjects a student has attendance records for"""
    # Students can only see their own subjects
    if current_user.role == "student" and current_user.user_id != usn:
        raise HTTPException(status_code=403, detail="Students can only view their own subject data")
    
    # Get all attendance records for this student
    records = db.query(AttendanceModel).filter(AttendanceModel.usn == usn).all()
    
    # Group by subject and class
    subjects_data = {}
    for record in records:
        subject_key = f"{record.class_id}_{record.subject}" if record.subject else record.class_id
        
        if subject_key not in subjects_data:
            subjects_data[subject_key] = {
                "class_id": record.class_id,
                "subject": record.subject or "Unknown Subject",
                "total_records": 0,
                "present_count": 0,
                "absent_count": 0,
                "cancelled_count": 0,
                "attendance_rate": 0.0,
                "last_marked": None
            }
        
        subject_data = subjects_data[subject_key]
        subject_data["total_records"] += 1
        
        if record.status == "present":
            subject_data["present_count"] += 1
        elif record.status == "absent":
            subject_data["absent_count"] += 1
        elif record.status == "cancelled":
            subject_data["cancelled_count"] += 1
        
        # Update last marked date
        if not subject_data["last_marked"] or record.date > subject_data["last_marked"]:
            subject_data["last_marked"] = record.date
    
    # Calculate attendance rates
    for subject_data in subjects_data.values():
        active_records = subject_data["present_count"] + subject_data["absent_count"]
        if active_records > 0:
            subject_data["attendance_rate"] = round(
                (subject_data["present_count"] / active_records * 100), 2
            )
    
    return {
        "student_usn": usn,
        "subjects": list(subjects_data.values())
    }


@router.get("/student/my-attendance")
async def get_my_attendance(
    semester: Optional[str] = Query(None, description="Filter by semester (e.g., '3', '5')"),
    subject: Optional[str] = Query(None, description="Filter by subject name"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current student's attendance with detailed breakdown by subject"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    query = db.query(AttendanceModel).filter(AttendanceModel.usn == current_user.user_id)
    
    # Apply filters
    if semester:
        # Extract semester from class_id (assuming format like "CS301" where 3 is semester)
        query = query.filter(AttendanceModel.class_id.like(f"%{semester}%"))
    
    if subject:
        query = query.filter(AttendanceModel.subject.ilike(f"%{subject}%"))
    
    if date_from:
        query = query.filter(AttendanceModel.date >= date_from)
    
    if date_to:
        query = query.filter(AttendanceModel.date <= date_to)
    
    records = query.order_by(AttendanceModel.date.desc()).all()
    
    # Group by subject for summary
    subject_summary = {}
    all_records = []
    
    for record in records:
        subject_name = record.subject or "Unknown Subject"
        
        # Add to detailed records
        all_records.append({
            "id": record.id,
            "class_id": record.class_id,
            "subject": subject_name,
            "date": record.date,
            "status": record.status,
            "period_start": record.period_start,
            "period_end": record.period_end,
            "marked_by": record.marked_by
        })
        
        # Update subject summary
        if subject_name not in subject_summary:
            subject_summary[subject_name] = {
                "subject": subject_name,
                "class_id": record.class_id,
                "total_classes": 0,
                "present": 0,
                "absent": 0,
                "cancelled": 0,
                "attendance_percentage": 0.0
            }
        
        summary = subject_summary[subject_name]
        summary["total_classes"] += 1
        
        if record.status == "present":
            summary["present"] += 1
        elif record.status == "absent":
            summary["absent"] += 1
        elif record.status == "cancelled":
            summary["cancelled"] += 1
    
    # Calculate attendance percentages
    for summary in subject_summary.values():
        active_classes = summary["present"] + summary["absent"]
        if active_classes > 0:
            summary["attendance_percentage"] = round(
                (summary["present"] / active_classes) * 100, 2
            )
    
    return {
        "student_usn": current_user.user_id,
        "student_name": current_user.full_name,
        "total_records": len(records),
        "subject_wise_summary": list(subject_summary.values()),
        "detailed_records": all_records
    }


@router.get("/professor/my-classes")
async def get_professor_classes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get classes and subjects assigned to current professor from timetable"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    from modules.timetable.models import Timetable
    
    # Get all timetable entries for this professor
    timetable_entries = db.query(Timetable).filter(
        Timetable.professor_usn == current_user.user_id
    ).all()
    
    if not timetable_entries:
        return {
            "professor_usn": current_user.user_id,
            "professor_name": current_user.full_name,
            "assigned_classes": [],
            "message": "No classes assigned to this professor"
        }
    
    # Group by class_id and subject
    classes_data = {}
    
    for entry in timetable_entries:
        class_subject_key = f"{entry.class_id}_{entry.subject}"
        
        if class_subject_key not in classes_data:
            classes_data[class_subject_key] = {
                "class_id": entry.class_id,
                "subject": entry.subject,
                "schedule": [],
                "total_students": 0,
                "attendance_summary": {
                    "total_classes_conducted": 0,
                    "average_attendance": 0.0
                }
            }
        
        classes_data[class_subject_key]["schedule"].append({
            "day": entry.day,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "is_cancelled": entry.is_cancelled,
            "cancel_reason": entry.cancel_reason
        })
    
    # Get attendance statistics for each class-subject combination
    for class_data in classes_data.values():
        attendance_records = db.query(AttendanceModel).filter(
            and_(
                AttendanceModel.class_id == class_data["class_id"],
                AttendanceModel.subject == class_data["subject"],
                AttendanceModel.marked_by == current_user.user_id
            )
        ).all()
        
        if attendance_records:
            # Count unique students
            unique_students = len(set([r.usn for r in attendance_records]))
            class_data["total_students"] = unique_students
            
            # Count classes conducted
            unique_dates = len(set([r.date for r in attendance_records if r.status != "cancelled"]))
            class_data["attendance_summary"]["total_classes_conducted"] = unique_dates
            
            # Calculate average attendance
            present_records = [r for r in attendance_records if r.status == "present"]
            active_records = [r for r in attendance_records if r.status in ["present", "absent"]]
            
            if active_records:
                avg_attendance = (len(present_records) / len(active_records)) * 100
                class_data["attendance_summary"]["average_attendance"] = round(avg_attendance, 2)
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "assigned_classes": list(classes_data.values())
    }


@router.get("/professor/class-students/{class_id}")
async def get_class_students_for_attendance(
    class_id: str,
    subject: str = Query(..., description="Subject name"),
    date_filter: Optional[date] = Query(None, description="Filter by specific date"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get students in a class for attendance marking by professor"""
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    from modules.timetable.models import Timetable
    
    # Verify professor is assigned to this class and subject
    assignment = db.query(Timetable).filter(
        and_(
            Timetable.class_id == class_id,
            Timetable.subject == subject,
            Timetable.professor_usn == current_user.user_id
        )
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=403,
            detail=f"You are not assigned to teach {subject} for class {class_id}"
        )
    
    # Get all students who have any attendance record for this class
    # This gives us the student list for the class
    student_records = db.query(AttendanceModel.usn).filter(
        AttendanceModel.class_id == class_id
    ).distinct().all()
    
    student_usns = [record.usn for record in student_records]
    
    # If no students found in attendance, return empty list with message
    if not student_usns:
        return {
            "class_id": class_id,
            "subject": subject,
            "students": [],
            "message": "No students found for this class. Students will appear after first attendance entry."
        }
    
    # Get student details from User table
    from modules.auth.models import User as UserModel
    students = db.query(UserModel).filter(
        and_(
            UserModel.user_id.in_(student_usns),
            UserModel.role == "student"
        )
    ).all()
    
    # Get attendance records for the specified date (if provided)
    attendance_query = db.query(AttendanceModel).filter(
        and_(
            AttendanceModel.class_id == class_id,
            AttendanceModel.subject == subject
        )
    )
    
    if date_filter:
        attendance_query = attendance_query.filter(AttendanceModel.date == date_filter)
    
    attendance_records = attendance_query.all()
    
    # Create attendance map for quick lookup
    attendance_map = {}
    for record in attendance_records:
        key = f"{record.usn}_{record.date}"
        attendance_map[key] = record.status
    
    # Prepare student list with attendance status
    student_list = []
    for student in students:
        student_data = {
            "usn": student.user_id,
            "name": student.full_name,
            "email": student.email
        }
        
        if date_filter:
            # Show attendance for specific date
            key = f"{student.user_id}_{date_filter}"
            student_data["attendance_status"] = attendance_map.get(key, "not_marked")
        else:
            # Show overall attendance summary
            student_attendance = [r for r in attendance_records if r.usn == student.user_id]
            total_classes = len(student_attendance)
            present_count = len([r for r in student_attendance if r.status == "present"])
            
            student_data["total_classes"] = total_classes
            student_data["present_count"] = present_count
            student_data["attendance_percentage"] = round(
                (present_count / total_classes * 100) if total_classes > 0 else 0, 2
            )
    
        student_list.append(student_data)
    
    return {
        "class_id": class_id,
        "subject": subject,
        "professor": current_user.full_name,
        "date_filter": date_filter,
        "total_students": len(student_list),
        "students": student_list
    }


@router.get("/admin/semester-report")
async def get_semester_attendance_report(
    semester: Optional[str] = Query(None, description="Semester number (e.g., '3', '5')"),
    class_id: Optional[str] = Query(None, description="Specific class ID"),
    subject: Optional[str] = Query(None, description="Specific subject"),
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive attendance report for admin - by semester, class, and subject"""
    if current_user.role not in ["admin", "professor"]:
        raise HTTPException(status_code=403, detail="Only admins and professors can access this endpoint")
    
    query = db.query(AttendanceModel)
    
    # Apply filters
    if semester:
        # Filter by semester (assuming class_id contains semester info)
        query = query.filter(AttendanceModel.class_id.like(f"%{semester}%"))
    
    if class_id:
        query = query.filter(AttendanceModel.class_id == class_id)
    
    if subject:
        query = query.filter(AttendanceModel.subject.ilike(f"%{subject}%"))
    
    records = query.all()
    
    if not records:
        return {
            "message": "No attendance records found for the specified criteria",
            "filters": {
                "semester": semester,
                "class_id": class_id,
                "subject": subject
            },
            "summary": {}
        }
    
    # Group data by class and subject
    class_subject_data = {}
    
    for record in records:
        key = f"{record.class_id}_{record.subject or 'Unknown'}"
        
        if key not in class_subject_data:
            class_subject_data[key] = {
                "class_id": record.class_id,
                "subject": record.subject or "Unknown Subject",
                "students": {},
                "total_classes": 0,
                "class_dates": set()
            }
        
        class_data = class_subject_data[key]
        class_data["class_dates"].add(record.date)
        
        # Track student attendance
        if record.usn not in class_data["students"]:
            class_data["students"][record.usn] = {
                "usn": record.usn,
                "present": 0,
                "absent": 0,
                "cancelled": 0,
                "total": 0,
                "attendance_percentage": 0.0
            }
        
        student_data = class_data["students"][record.usn]
        student_data["total"] += 1
        
        if record.status == "present":
            student_data["present"] += 1
        elif record.status == "absent":
            student_data["absent"] += 1
        elif record.status == "cancelled":
            student_data["cancelled"] += 1
    
    # Calculate statistics
    report_data = []
    
    for class_data in class_subject_data.values():
        # Calculate attendance percentages for each student
        for student_data in class_data["students"].values():
            active_classes = student_data["present"] + student_data["absent"]
            if active_classes > 0:
                student_data["attendance_percentage"] = round(
                    (student_data["present"] / active_classes) * 100, 2
                )
        
        # Calculate class statistics
        total_students = len(class_data["students"])
        total_classes_conducted = len(class_data["class_dates"])
        
        # Calculate average attendance for the class
        if total_students > 0:
            total_attendance_sum = sum([
                s["attendance_percentage"] for s in class_data["students"].values()
            ])
            average_class_attendance = round(total_attendance_sum / total_students, 2)
        else:
            average_class_attendance = 0.0
        
        report_data.append({
            "class_id": class_data["class_id"],
            "subject": class_data["subject"],
            "total_students": total_students,
            "total_classes_conducted": total_classes_conducted,
            "average_attendance_percentage": average_class_attendance,
            "students": list(class_data["students"].values())
        })
    
    return {
        "filters": {
            "semester": semester,
            "class_id": class_id,
            "subject": subject
        },
        "summary": {
            "total_classes": len(class_subject_data),
            "total_records": len(records)
        },
        "class_subject_reports": report_data
    }