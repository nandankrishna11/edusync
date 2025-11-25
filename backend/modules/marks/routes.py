"""
Student Marks module with role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from database import get_db
from models.models import StudentMarks, User, StudentRegistry, SubjectMaster, MarksSummary
from schemas.schemas import (
    StudentMarksCreate, BulkMarksCreate, StudentMarksResponse
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin
from utils.usn_utils import (
    parse_usn, calculate_current_semester, calculate_grade,
    get_department_name
)

router = APIRouter(prefix="/marks", tags=["marks"])


@router.post("/professor/add-marks")
async def add_student_marks(
    marks_data: BulkMarksCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add marks for students (Professor only)"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can add marks")
    
    created_records = []
    errors = []
    
    for i, record in enumerate(marks_data.marks_records):
        try:
            student_usn = record.get("student_usn")
            obtained_marks = record.get("obtained_marks")
            remarks = record.get("remarks", "")
            
            if not student_usn:
                errors.append({"index": i, "error": "student_usn is required"})
                continue
            
            if obtained_marks is None:
                errors.append({"index": i, "error": "obtained_marks is required"})
                continue
            
            # Check if marks already exist for this assessment
            existing = db.query(StudentMarks).filter(
                StudentMarks.student_usn == student_usn,
                StudentMarks.subject_code == marks_data.subject_code,
                StudentMarks.assessment_type == marks_data.assessment_type,
                StudentMarks.assessment_name == marks_data.assessment_name
            ).first()
            
            if existing:
                # Update existing record
                existing.obtained_marks = obtained_marks
                existing.remarks = remarks
                existing.professor_usn = current_user.user_id
                created_records.append({
                    "student_usn": student_usn,
                    "obtained_marks": obtained_marks,
                    "action": "updated"
                })
            else:
                # Create new record
                new_marks = StudentMarks(
                    student_usn=student_usn,
                    department_code=marks_data.department_code,
                    semester=marks_data.semester,
                    section=marks_data.section,
                    subject_code=marks_data.subject_code,
                    assessment_type=marks_data.assessment_type,
                    assessment_name=marks_data.assessment_name,
                    max_marks=marks_data.max_marks,
                    obtained_marks=obtained_marks,
                    assessment_date=marks_data.assessment_date,
                    remarks=remarks,
                    professor_usn=current_user.user_id
                )
                
                db.add(new_marks)
                created_records.append({
                    "student_usn": student_usn,
                    "obtained_marks": obtained_marks,
                    "action": "created"
                })
                
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


@router.get("/professor/subject-marks")
async def get_subject_marks(
    subject_code: str = Query(...),
    assessment_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get marks for a subject (Professor only)"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can view marks")
    
    # Build query
    query = db.query(StudentMarks).filter(StudentMarks.subject_code == subject_code)
    
    if assessment_type:
        query = query.filter(StudentMarks.assessment_type == assessment_type)
    
    marks_records = query.order_by(StudentMarks.student_usn, StudentMarks.assessment_date.desc()).all()
    
    # Group by student
    student_marks = {}
    for record in marks_records:
        if record.student_usn not in student_marks:
            student_marks[record.student_usn] = []
        
        student_marks[record.student_usn].append({
            "id": record.id,
            "assessment_type": record.assessment_type,
            "assessment_name": record.assessment_name,
            "max_marks": record.max_marks,
            "obtained_marks": record.obtained_marks,
            "assessment_date": record.assessment_date,
            "remarks": record.remarks
        })
    
    return {
        "subject_code": subject_code,
        "assessment_type": assessment_type,
        "total_students": len(student_marks),
        "student_marks": student_marks
    }


@router.get("/student/my-marks")
async def get_student_marks(
    subject_code: Optional[str] = Query(None),
    assessment_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get marks for current student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view their marks")
    
    # Build query
    query = db.query(StudentMarks).filter(StudentMarks.student_usn == current_user.user_id)
    
    if subject_code:
        query = query.filter(StudentMarks.subject_code == subject_code)
    if assessment_type:
        query = query.filter(StudentMarks.assessment_type == assessment_type)
    
    marks_records = query.order_by(StudentMarks.assessment_date.desc()).all()
    
    # Group by subject
    subject_marks = {}
    for record in marks_records:
        if record.subject_code not in subject_marks:
            subject_marks[record.subject_code] = {
                "subject_code": record.subject_code,
                "department_code": record.department_code,
                "semester": record.semester,
                "assessments": []
            }
        
        subject_marks[record.subject_code]["assessments"].append({
            "id": record.id,
            "assessment_type": record.assessment_type,
            "assessment_name": record.assessment_name,
            "max_marks": record.max_marks,
            "obtained_marks": record.obtained_marks,
            "assessment_date": record.assessment_date,
            "remarks": record.remarks,
            "percentage": round((record.obtained_marks / record.max_marks) * 100, 2)
        })
    
    return {
        "student_usn": current_user.user_id,
        "total_subjects": len(subject_marks),
        "subject_marks": list(subject_marks.values())
    }


@router.get("/admin/marks-overview")
async def get_marks_overview(
    department_code: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    subject_code: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get marks overview for admin"""
    
    # Get all students based on filters
    student_query = db.query(User).filter(User.role == "student")
    
    if department_code:
        # Filter by department (assuming USN contains department info)
        student_query = student_query.filter(User.user_id.like(f"%{department_code}%"))
    
    students = student_query.all()
    student_usns = [s.user_id for s in students]
    
    # Build marks query
    marks_query = db.query(StudentMarks).filter(StudentMarks.student_usn.in_(student_usns))
    
    if subject_code:
        marks_query = marks_query.filter(StudentMarks.subject_code == subject_code)
    
    marks_records = marks_query.all()
    
    # Calculate statistics
    total_students = len(students)
    students_with_marks = len(set([r.student_usn for r in marks_records]))
    total_assessments = len(marks_records)
    
    # Calculate average marks
    if marks_records:
        total_obtained = sum([r.obtained_marks for r in marks_records])
        total_max = sum([r.max_marks for r in marks_records])
        average_percentage = (total_obtained / total_max) * 100 if total_max > 0 else 0
    else:
        average_percentage = 0
    
    return {
        "department_code": department_code,
        "semester": semester,
        "subject_code": subject_code,
        "total_students": total_students,
        "students_with_marks": students_with_marks,
        "total_assessments": total_assessments,
        "average_percentage": round(average_percentage, 2),
        "marks_records": len(marks_records)
    }


@router.put("/marks/{marks_id}")
async def update_marks(
    marks_id: int,
    obtained_marks: float,
    remarks: Optional[str] = None,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Update marks record"""
    
    marks_record = db.query(StudentMarks).filter(StudentMarks.id == marks_id).first()
    
    if not marks_record:
        raise HTTPException(status_code=404, detail="Marks record not found")
    
    # Check if professor is updating their own record
    if current_user.role == "professor" and marks_record.professor_usn != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only update marks you created")
    
    marks_record.obtained_marks = obtained_marks
    if remarks is not None:
        marks_record.remarks = remarks
    
    db.commit()
    db.refresh(marks_record)
    
    return {
        "id": marks_record.id,
        "student_usn": marks_record.student_usn,
        "obtained_marks": marks_record.obtained_marks,
        "remarks": marks_record.remarks,
        "message": "Marks updated successfully"
    }


@router.delete("/marks/{marks_id}")
async def delete_marks(
    marks_id: int,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Delete marks record"""
    
    marks_record = db.query(StudentMarks).filter(StudentMarks.id == marks_id).first()
    
    if not marks_record:
        raise HTTPException(status_code=404, detail="Marks record not found")
    
    # Check if professor is deleting their own record
    if current_user.role == "professor" and marks_record.professor_usn != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete marks you created")
    
    db.delete(marks_record)
    db.commit()
    
    return {"message": "Marks record deleted successfully"}