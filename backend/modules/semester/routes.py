"""
Semester system API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.student_model import Student, Department, Subject, Semester
from schemas.semester_schemas import (
    StudentResponse, StudentCreate, StudentUpdate,
    DepartmentResponse, DepartmentCreate, DepartmentUpdate,
    SubjectResponse, SubjectCreate, SubjectUpdate,
    SemesterResponse, SemesterCreate, SemesterUpdate
)
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin
from modules.auth.models import User
from services.academic_services import USNService, SubjectCodeService, AcademicCalendarService

router = APIRouter(prefix="/semester", tags=["semester"])

# Student routes
@router.get("/students", response_model=List[StudentResponse])
async def get_students(
    department: Optional[str] = Query(None, description="Filter by department code"),
    semester: Optional[int] = Query(None, description="Filter by semester (1-8)"),
    batch: Optional[str] = Query(None, description="Filter by batch year"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get students with filtering options"""
    query = db.query(Student)
    
    # Role-based filtering
    if current_user.role == "student":
        # Students can only see themselves
        query = query.filter(Student.usn == current_user.user_id)
    elif current_user.role == "professor":
        # Professors can see students in their department
        if current_user.department_code:
            query = query.filter(Student.department_code == current_user.department_code)
    # Admins can see all students
    
    if department:
        query = query.filter(Student.department_code == department)
    if semester:
        query = query.filter(Student.current_semester == semester)
    if batch:
        query = query.filter(Student.batch == batch)
    
    return query.all()

@router.post("/students", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new student record"""
    # Validate USN format
    try:
        usn_components = USNService.parse_usn(student.usn)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check if student already exists
    existing = db.query(Student).filter(Student.usn == student.usn).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this USN already exists")
    
    # Calculate academic info from USN
    current_semester = USNService.get_current_semester(student.usn)
    batch_year = USNService.get_batch_year(student.usn)
    academic_year = AcademicCalendarService.get_current_academic_year()
    
    # Create student record
    db_student = Student(
        usn=student.usn,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        institution_code=usn_components["institution_code"],
        joined_year=usn_components["joined_year"],
        department_code=usn_components["department_code"],
        roll_number=usn_components["roll_number"],
        current_semester=student.current_semester or current_semester,
        academic_year=academic_year,
        batch=batch_year
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/students/{usn}", response_model=StudentResponse)
async def get_student(
    usn: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get student by USN"""
    # Students can only see their own record
    if current_user.role == "student" and current_user.user_id != usn:
        raise HTTPException(status_code=403, detail="Students can only view their own record")
    
    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student

# Department routes
@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all departments"""
    return db.query(Department).filter(Department.is_active == True).all()

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(
    department: DepartmentCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new department"""
    existing = db.query(Department).filter(Department.code == department.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this code already exists")
    
    db_department = Department(**department.dict())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

# Subject routes
@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(
    department: Optional[str] = Query(None, description="Filter by department code"),
    semester: Optional[int] = Query(None, description="Filter by semester (1-8)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get subjects with filtering"""
    query = db.query(Subject).filter(Subject.is_active == True)
    
    if department:
        query = query.filter(Subject.department_code == department)
    if semester:
        query = query.filter(Subject.semester == semester)
    
    return query.all()

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    subject: SubjectCreate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new subject"""
    # Validate subject code format
    try:
        code_components = SubjectCodeService.parse_subject_code(subject.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    existing = db.query(Subject).filter(Subject.code == subject.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this code already exists")
    
    # Create subject with parsed components
    db_subject = Subject(
        code=subject.code,
        name=subject.name,
        degree_type=code_components["degree_type"],
        department_code=code_components["department_code"],
        semester=code_components["semester"],
        sequence=code_components["sequence"],
        credits=subject.credits,
        theory_hours=subject.theory_hours,
        lab_hours=subject.lab_hours
    )
    
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

# Semester routes
@router.get("/semesters", response_model=List[SemesterResponse])
async def get_semesters(
    department: Optional[str] = Query(None, description="Filter by department code"),
    academic_year: Optional[str] = Query(None, description="Filter by academic year"),
    active_only: bool = Query(True, description="Show only active semesters"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get semester records"""
    query = db.query(Semester)
    
    if department:
        query = query.filter(Semester.department_code == department)
    if academic_year:
        query = query.filter(Semester.academic_year == academic_year)
    if active_only:
        query = query.filter(Semester.is_active == True)
    
    return query.all()

# Utility routes
@router.get("/utils/parse-usn/{usn}")
async def parse_usn(
    usn: str,
    current_user: User = Depends(get_current_active_user)
):
    """Parse USN into components"""
    try:
        components = USNService.parse_usn(usn)
        current_semester = USNService.get_current_semester(usn)
        batch_year = USNService.get_batch_year(usn)
        
        return {
            "usn": usn,
            "components": components,
            "current_semester": current_semester,
            "batch_year": batch_year,
            "is_valid": True
        }
    except ValueError as e:
        return {
            "usn": usn,
            "error": str(e),
            "is_valid": False
        }

@router.get("/utils/parse-subject/{code}")
async def parse_subject_code(
    code: str,
    current_user: User = Depends(get_current_active_user)
):
    """Parse subject code into components"""
    try:
        components = SubjectCodeService.parse_subject_code(code)
        return {
            "code": code,
            "components": components,
            "is_valid": True
        }
    except ValueError as e:
        return {
            "code": code,
            "error": str(e),
            "is_valid": False
        }

@router.get("/utils/current-academic-year")
async def get_current_academic_year(
    current_user: User = Depends(get_current_active_user)
):
    """Get current academic year"""
    return {
        "academic_year": AcademicCalendarService.get_current_academic_year(),
        "current_date": date.today().isoformat()
    }