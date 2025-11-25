"""
Enhanced Timetable routes with semester-based logic
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from database import get_db
from models.models import Timetable, User, SubjectMaster
from schemas.schemas import TimetableCreate, TimetableUpdate, TimetableResponse
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin
from utils.usn_utils import parse_usn, calculate_current_semester, get_department_name

router = APIRouter(prefix="/enhanced/timetable", tags=["enhanced-timetable"])


# ============= PROFESSOR ENDPOINTS =============

@router.get("/professor/my-classes")
async def get_professor_classes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get classes assigned to current professor"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    timetable_entries = db.query(Timetable).filter(
        Timetable.professor_usn == current_user.user_id
    ).order_by(Timetable.day, Timetable.period_start).all()
    
    if not timetable_entries:
        return {
            "professor_usn": current_user.user_id,
            "professor_name": current_user.full_name,
            "classes": [],
            "message": "No classes assigned"
        }
    
    # Group by class
    classes_data = {}
    
    for entry in timetable_entries:
        # Use both legacy and new system
        if entry.class_id:
            class_key = entry.class_id
            class_name = entry.class_id
            subject_name = entry.subject or "Unknown Subject"
        else:
            class_key = f"{entry.department_code}_{entry.semester}_{entry.section}_{entry.subject_code}"
            class_name = f"{entry.department_code} Semester {entry.semester} Section {entry.section}"
            subject_name = entry.subject_code
            
            # Try to get subject name from master
            subject_master = db.query(SubjectMaster).filter(
                SubjectMaster.subject_code == entry.subject_code
            ).first()
            if subject_master:
                subject_name = subject_master.subject_name
        
        if class_key not in classes_data:
            classes_data[class_key] = {
                "class_identifier": class_key,
                "class_name": class_name,
                "subject_code": entry.subject_code or entry.subject,
                "subject_name": subject_name,
                "department_code": entry.department_code,
                "semester": entry.semester,
                "section": entry.section,
                "schedule": [],
                "total_periods": 0,
                "cancelled_periods": 0
            }
        
        classes_data[class_key]["schedule"].append({
            "id": entry.id,
            "day": entry.day,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "is_cancelled": entry.is_cancelled,
            "cancel_reason": entry.cancel_reason
        })
        
        classes_data[class_key]["total_periods"] += 1
        if entry.is_cancelled:
            classes_data[class_key]["cancelled_periods"] += 1
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "total_classes": len(classes_data),
        "classes": list(classes_data.values())
    }


@router.patch("/professor/cancel-class/{timetable_id}")
async def cancel_class(
    timetable_id: int,
    cancel_reason: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a specific class period"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can cancel classes")
    
    # Get timetable entry
    timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    
    if not timetable_entry:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify professor owns this class
    if timetable_entry.professor_usn != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own classes")
    
    # Cancel the class
    timetable_entry.is_cancelled = True
    timetable_entry.cancel_reason = cancel_reason
    
    db.commit()
    
    return {
        "message": "Class cancelled successfully",
        "class_info": {
            "id": timetable_entry.id,
            "subject": timetable_entry.subject or timetable_entry.subject_code,
            "day": timetable_entry.day,
            "period": f"{timetable_entry.period_start} - {timetable_entry.period_end}",
            "cancel_reason": cancel_reason
        }
    }


@router.patch("/professor/restore-class/{timetable_id}")
async def restore_class(
    timetable_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Restore a cancelled class"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can restore classes")
    
    # Get timetable entry
    timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    
    if not timetable_entry:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify professor owns this class
    if timetable_entry.professor_usn != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only restore your own classes")
    
    # Restore the class
    timetable_entry.is_cancelled = False
    timetable_entry.cancel_reason = None
    
    db.commit()
    
    return {
        "message": "Class restored successfully",
        "class_info": {
            "id": timetable_entry.id,
            "subject": timetable_entry.subject or timetable_entry.subject_code,
            "day": timetable_entry.day,
            "period": f"{timetable_entry.period_start} - {timetable_entry.period_end}"
        }
    }


# ============= STUDENT ENDPOINTS =============

@router.get("/student/my-timetable")
async def get_student_timetable(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get timetable for current student based on USN"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    try:
        # Get student info from user record
        student_usn = current_user.student_usn or current_user.user_id
        department_code = current_user.department_code
        
        # If department not in user record, try to parse from USN
        if not department_code:
            usn_components = parse_usn(student_usn)
            if usn_components:
                department_code = usn_components['department_code']
                current_semester = calculate_current_semester(usn_components['year_joined'])
            else:
                raise HTTPException(status_code=400, detail="Invalid USN format and no department info")
        else:
            # Calculate semester from USN if available
            usn_components = parse_usn(student_usn)
            if usn_components:
                current_semester = calculate_current_semester(usn_components['year_joined'])
            else:
                current_semester = 5  # Default to semester 5 if can't parse
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing student info: {str(e)}")
    
    # Get timetable for current semester
    timetable_entries = db.query(Timetable).filter(
        Timetable.department_code == department_code,
        Timetable.semester == current_semester,
        Timetable.section == "A"  # Default section
    ).order_by(Timetable.day, Timetable.period_start).all()
    
    if not timetable_entries:
        return {
            "student_info": {
                "usn": current_user.user_id,
                "name": current_user.full_name,
                "department_code": department_code,
                "department_name": get_department_name(department_code),
                "current_semester": current_semester,
                "section": "A"
            },
            "timetable": [],
            "message": f"No timetable found for {department_code} semester {current_semester}"
        }
    
    # Group by day
    daily_schedule = {}
    
    for entry in timetable_entries:
        if entry.day not in daily_schedule:
            daily_schedule[entry.day] = []
        
        # Get professor info
        professor = db.query(User).filter(User.user_id == entry.professor_usn).first()
        
        # Get subject name
        subject_name = entry.subject or entry.subject_code
        if entry.subject_code:
            subject_master = db.query(SubjectMaster).filter(
                SubjectMaster.subject_code == entry.subject_code
            ).first()
            if subject_master:
                subject_name = subject_master.subject_name
        
        daily_schedule[entry.day].append({
            "id": entry.id,
            "subject_code": entry.subject_code or entry.subject,
            "subject_name": subject_name,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "professor_usn": entry.professor_usn,
            "professor_name": professor.full_name if professor else "Unknown Professor",
            "is_cancelled": entry.is_cancelled,
            "cancel_reason": entry.cancel_reason
        })
    
    return {
        "student_info": {
            "usn": current_user.user_id,
            "name": current_user.full_name,
            "department_code": department_code,
            "department_name": get_department_name(department_code),
            "current_semester": current_semester,
            "section": "A"
        },
        "total_classes": len(timetable_entries),
        "daily_schedule": daily_schedule
    }


@router.get("/student/upcoming-classes")
async def get_upcoming_classes(
    days: int = Query(7, le=30),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get upcoming classes for student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    try:
        # Get student info from user record
        student_usn = current_user.student_usn or current_user.user_id
        department_code = current_user.department_code
        
        # If department not in user record, try to parse from USN
        if not department_code:
            usn_components = parse_usn(student_usn)
            if usn_components:
                department_code = usn_components['department_code']
                current_semester = calculate_current_semester(usn_components['year_joined'])
            else:
                raise HTTPException(status_code=400, detail="Invalid USN format and no department info")
        else:
            # Calculate semester from USN if available
            usn_components = parse_usn(student_usn)
            if usn_components:
                current_semester = calculate_current_semester(usn_components['year_joined'])
            else:
                current_semester = 5  # Default to semester 5 if can't parse
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing student info: {str(e)}")
    
    # Get timetable for current semester
    timetable_entries = db.query(Timetable).filter(
        Timetable.department_code == department_code,
        Timetable.semester == current_semester,
        Timetable.section == "A",  # Default section
        Timetable.is_cancelled == False
    ).all()
    
    # Get current day and upcoming days
    current_date = datetime.now().date()
    upcoming_classes = []
    
    for i in range(days):
        check_date = current_date + timedelta(days=i)
        day_name = check_date.strftime("%A")
        
        # Find classes for this day
        day_classes = [entry for entry in timetable_entries if entry.day == day_name]
        
        for entry in day_classes:
            # Get subject and professor info
            subject_name = entry.subject or entry.subject_code
            if entry.subject_code:
                subject_master = db.query(SubjectMaster).filter(
                    SubjectMaster.subject_code == entry.subject_code
                ).first()
                if subject_master:
                    subject_name = subject_master.subject_name
            
            professor = db.query(User).filter(User.user_id == entry.professor_usn).first()
            
            upcoming_classes.append({
                "date": check_date,
                "day": day_name,
                "subject_code": entry.subject_code or entry.subject,
                "subject_name": subject_name,
                "period_start": entry.period_start,
                "period_end": entry.period_end,
                "professor_name": professor.full_name if professor else "Unknown Professor"
            })
    
    # Sort by date and time
    upcoming_classes.sort(key=lambda x: (x["date"], x["period_start"]))
    
    return {
        "student_usn": current_user.user_id,
        "department_code": department_code,
        "current_semester": current_semester,
        "period_days": days,
        "total_upcoming_classes": len(upcoming_classes),
        "upcoming_classes": upcoming_classes
    }


# ============= ADMIN ENDPOINTS =============

@router.post("/admin/create-timetable")
async def create_timetable_entry_admin(
    timetable_data: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry - Admin only"""
    
    try:
        # Validate required fields
        required_fields = ['department_code', 'semester', 'section', 'subject_code', 'day', 'period_start', 'period_end', 'professor_usn']
        for field in required_fields:
            if field not in timetable_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create timetable entry
        db_timetable = Timetable(
            department_code=timetable_data['department_code'],
            semester=int(timetable_data['semester']),
            section=timetable_data['section'],
            subject_code=timetable_data['subject_code'].upper(),
            day=timetable_data['day'],
            period_start=timetable_data['period_start'],
            period_end=timetable_data['period_end'],
            professor_usn=timetable_data['professor_usn'],
            is_cancelled=False
        )
        
        db.add(db_timetable)
        db.commit()
        db.refresh(db_timetable)
        
        return {
            "id": db_timetable.id,
            "message": "Timetable entry created successfully",
            "entry": {
                "id": db_timetable.id,
                "department_code": db_timetable.department_code,
                "semester": db_timetable.semester,
                "section": db_timetable.section,
                "subject_code": db_timetable.subject_code,
                "day": db_timetable.day,
                "period_start": db_timetable.period_start,
                "period_end": db_timetable.period_end,
                "professor_usn": db_timetable.professor_usn
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create timetable entry: {str(e)}")


@router.delete("/admin/delete-timetable/{timetable_id}")
async def delete_timetable_entry_admin(
    timetable_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a timetable entry - Admin only"""
    
    try:
        # Find the timetable entry
        timetable_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
        
        if not timetable_entry:
            raise HTTPException(status_code=404, detail="Timetable entry not found")
        
        # Delete the entry
        db.delete(timetable_entry)
        db.commit()
        
        return {
            "message": "Timetable entry deleted successfully",
            "deleted_id": timetable_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete timetable entry: {str(e)}")


@router.get("/admin/semester-timetable/{department_code}/{semester}")
async def get_semester_timetable_admin(
    department_code: str,
    semester: int,
    section: str = Query("A", description="Section (A, B, C)"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get timetable for a specific department, semester, and section - Admin only"""
    
    timetable_entries = db.query(Timetable).filter(
        Timetable.department_code == department_code,
        Timetable.semester == semester,
        Timetable.section == section
    ).order_by(Timetable.day, Timetable.period_start).all()
    
    if not timetable_entries:
        return {
            "department_code": department_code,
            "department_name": get_department_name(department_code),
            "semester": semester,
            "section": section,
            "timetable": [],
            "message": f"No timetable found for {department_code} semester {semester} section {section}"
        }
    
    # Group by day for better organization
    daily_schedule = {}
    
    for entry in timetable_entries:
        if entry.day not in daily_schedule:
            daily_schedule[entry.day] = []
        
        # Get professor info
        professor = db.query(User).filter(User.user_id == entry.professor_usn).first()
        
        # Get subject name from subject master
        subject_name = entry.subject_code
        if entry.subject_code:
            subject_master = db.query(SubjectMaster).filter(
                SubjectMaster.subject_code == entry.subject_code
            ).first()
            if subject_master:
                subject_name = subject_master.subject_name
        
        daily_schedule[entry.day].append({
            "id": entry.id,
            "subject_code": entry.subject_code,
            "subject_name": subject_name,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "professor_usn": entry.professor_usn,
            "professor_name": professor.full_name if professor else "Unknown Professor",
            "is_cancelled": entry.is_cancelled,
            "cancel_reason": entry.cancel_reason
        })
    
    return {
        "department_code": department_code,
        "department_name": get_department_name(department_code),
        "semester": semester,
        "section": section,
        "total_classes": len(timetable_entries),
        "daily_schedule": daily_schedule
    }


@router.get("/admin/department-overview/{department_code}")
async def get_department_overview(
    department_code: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get overview of all timetables for a department"""
    
    timetable_entries = db.query(Timetable).filter(
        Timetable.department_code == department_code
    ).order_by(
        Timetable.semester, Timetable.section, Timetable.day, Timetable.period_start
    ).all()
    
    if not timetable_entries:
        return {
            "department_code": department_code,
            "department_name": get_department_name(department_code),
            "semesters": [],
            "message": "No timetable entries found for this department"
        }
    
    # Group by semester and section
    semester_data = {}
    
    for entry in timetable_entries:
        if not entry.semester:
            continue  # Skip legacy entries without semester info
            
        semester_key = f"{entry.semester}-{entry.section}"
        
        if semester_key not in semester_data:
            semester_data[semester_key] = {
                "semester": entry.semester,
                "section": entry.section,
                "total_classes": 0,
                "cancelled_classes": 0,
                "subjects": set(),
                "professors": set(),
                "schedule": []
            }
        
        semester_data[semester_key]["total_classes"] += 1
        if entry.is_cancelled:
            semester_data[semester_key]["cancelled_classes"] += 1
        
        if entry.subject_code:
            semester_data[semester_key]["subjects"].add(entry.subject_code)
        elif entry.subject:
            semester_data[semester_key]["subjects"].add(entry.subject)
            
        semester_data[semester_key]["professors"].add(entry.professor_usn)
        
        # Get professor info
        professor = db.query(User).filter(User.user_id == entry.professor_usn).first()
        
        semester_data[semester_key]["schedule"].append({
            "id": entry.id,
            "subject": entry.subject_code or entry.subject,
            "day": entry.day,
            "period_start": entry.period_start,
            "period_end": entry.period_end,
            "professor_usn": entry.professor_usn,
            "professor_name": professor.full_name if professor else "Unknown",
            "is_cancelled": entry.is_cancelled,
            "cancel_reason": entry.cancel_reason
        })
    
    # Convert sets to lists for JSON serialization
    for data in semester_data.values():
        data["subjects"] = list(data["subjects"])
        data["professors"] = list(data["professors"])
        data["unique_subjects"] = len(data["subjects"])
        data["unique_professors"] = len(data["professors"])
    
    return {
        "department_code": department_code,
        "department_name": get_department_name(department_code),
        "total_semesters": len(semester_data),
        "semesters": list(semester_data.values())
    }