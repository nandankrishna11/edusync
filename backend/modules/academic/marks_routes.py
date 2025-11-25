"""
Marks Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database import get_db
from models.models import StudentMark, User
from schemas.schemas import MarkCreate, MarkUpdate, MarkResponse
from modules.auth.services import get_current_user

router = APIRouter(prefix="/marks", tags=["marks"])


@router.post("/", response_model=MarkResponse)
async def create_mark(
    mark: MarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new mark entry (Professor only)"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Only professors can enter marks")
    
    db_mark = StudentMark(
        **mark.dict(),
        professor_id=current_user.user_id
    )
    db.add(db_mark)
    db.commit()
    db.refresh(db_mark)
    return db_mark


@router.get("/professor", response_model=List[MarkResponse])
async def get_professor_marks(
    subject_code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all marks entered by current professor"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(StudentMark).filter(StudentMark.professor_id == current_user.user_id)
    
    if subject_code:
        query = query.filter(StudentMark.subject_code == subject_code)
    
    return query.order_by(StudentMark.created_at.desc()).all()


@router.get("/student/{student_id}", response_model=List[MarkResponse])
async def get_student_marks(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all marks for a student"""
    # Students can only see their own marks
    if current_user.role == "student" and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    marks = db.query(StudentMark).filter(
        StudentMark.student_id == student_id
    ).order_by(StudentMark.assessment_date.desc()).all()
    
    return marks


@router.get("/subject/{subject_code}", response_model=List[MarkResponse])
async def get_subject_marks(
    subject_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all marks for a subject (Professor/Admin only)"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    marks = db.query(StudentMark).filter(
        StudentMark.subject_code == subject_code
    ).order_by(StudentMark.student_id, StudentMark.assessment_date).all()
    
    return marks


@router.put("/{mark_id}", response_model=MarkResponse)
async def update_mark(
    mark_id: int,
    mark_update: MarkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a mark entry"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_mark = db.query(StudentMark).filter(StudentMark.id == mark_id).first()
    if not db_mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    # Only the professor who created it or admin can update
    if current_user.role == "professor" and db_mark.professor_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Can only update your own entries")
    
    for key, value in mark_update.dict(exclude_unset=True).items():
        setattr(db_mark, key, value)
    
    db.commit()
    db.refresh(db_mark)
    return db_mark


@router.delete("/{mark_id}")
async def delete_mark(
    mark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a mark entry"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_mark = db.query(StudentMark).filter(StudentMark.id == mark_id).first()
    if not db_mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    # Only the professor who created it or admin can delete
    if current_user.role == "professor" and db_mark.professor_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Can only delete your own entries")
    
    db.delete(db_mark)
    db.commit()
    return {"message": "Mark deleted successfully"}


@router.get("/statistics/class")
async def get_class_statistics(
    subject_code: str,
    assessment_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get class statistics for a subject"""
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(StudentMark).filter(StudentMark.subject_code == subject_code)
    
    if assessment_type:
        query = query.filter(StudentMark.assessment_type == assessment_type)
    
    marks = query.all()
    
    if not marks:
        return {"message": "No marks found"}
    
    total_students = len(set([m.student_id for m in marks]))
    percentages = [(m.marks_obtained / m.max_marks * 100) for m in marks]
    
    return {
        "subject_code": subject_code,
        "total_students": total_students,
        "total_assessments": len(marks),
        "average_percentage": sum(percentages) / len(percentages) if percentages else 0,
        "highest_percentage": max(percentages) if percentages else 0,
        "lowest_percentage": min(percentages) if percentages else 0
    }
