"""
Notifications routes with role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from database import get_db
from models.models import NotificationModel, User
from schemas.schemas import NotificationResponse, NotificationCreate, NotificationUpdate
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    notification_type: Optional[str] = Query(None, description="Filter by type: general, attendance, marks, timetable"),
    target_department: Optional[str] = Query(None, description="Filter by department"),
    target_semester: Optional[int] = Query(None, description="Filter by semester"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications with role-based filtering"""
    query = db.query(NotificationModel).filter(NotificationModel.is_active == True)
    
    # Role-based filtering
    if current_user.role == "student":
        # Students can see:
        # 1. Notifications targeted to them specifically
        # 2. Notifications targeted to students in general
        # 3. Global notifications (no target_role)
        # 4. Notifications for their department/semester
        query = query.filter(
            (NotificationModel.target_user_id == current_user.user_id) | 
            (NotificationModel.target_role == "student") |
            (NotificationModel.target_role.is_(None))
        )
    elif current_user.role == "professor":
        # Professors can see:
        # 1. Notifications targeted to them specifically
        # 2. Notifications targeted to professors
        # 3. Global notifications
        query = query.filter(
            (NotificationModel.target_user_id == current_user.user_id) |
            (NotificationModel.target_role == "professor") |
            (NotificationModel.target_role.is_(None))
        )
    # Admins can see all notifications (no additional filtering)
    
    # Apply additional filters
    if notification_type:
        query = query.filter(NotificationModel.notification_type == notification_type)
    if target_department:
        query = query.filter(
            (NotificationModel.target_department == target_department) |
            (NotificationModel.target_department.is_(None))
        )
    if target_semester:
        query = query.filter(
            (NotificationModel.target_semester == target_semester) |
            (NotificationModel.target_semester.is_(None))
        )
    
    notifications = query.order_by(NotificationModel.created_at.desc()).limit(limit).all()
    return notifications


@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification: NotificationCreate, 
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new notification - professors and admins only"""
    notification_data = notification.dict()
    notification_data["created_by"] = current_user.user_id
    
    db_notification = NotificationModel(**notification_data)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Update a notification - professors and admins only"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Only allow creators or admins to update
    if current_user.role != "admin" and notification.created_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")
    
    update_data = notification_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notification, field, value)
    
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int, 
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Delete a notification - professors and admins only"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Only allow creators or admins to delete
    if current_user.role != "admin" and notification.created_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}


# ============= ADMIN SPECIFIC ENDPOINTS =============

@router.post("/admin/create")
def create_admin_notification(
    notification_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new notification (Admin only)"""
    
    # Validate required fields
    if not notification_data.get("title") or not notification_data.get("message"):
        raise HTTPException(status_code=400, detail="Title and message are required")
    
    # Create notification
    db_notification = NotificationModel(
        title=notification_data["title"],
        message=notification_data["message"],
        notification_type=notification_data.get("notification_type", "general"),
        target_role=notification_data.get("target_role"),
        target_user_id=notification_data.get("target_user_id"),
        target_department=notification_data.get("target_department"),
        target_semester=notification_data.get("target_semester"),
        priority=notification_data.get("priority", "normal"),
        created_by=current_user.user_id,
        expires_at=notification_data.get("expires_at")
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Calculate target count
    target_count = calculate_target_count(db, db_notification)
    
    return {
        "id": db_notification.id,
        "title": db_notification.title,
        "message": db_notification.message,
        "notification_type": db_notification.notification_type,
        "target_role": db_notification.target_role,
        "target_department": db_notification.target_department,
        "target_semester": db_notification.target_semester,
        "target_count": target_count,
        "created_at": db_notification.created_at,
        "message_status": "Notification created successfully"
    }


@router.get("/admin/all")
def get_all_admin_notifications(
    limit: int = Query(100, le=200),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all notifications with admin details"""
    
    notifications = db.query(NotificationModel).order_by(
        NotificationModel.created_at.desc()
    ).limit(limit).all()
    
    notification_data = []
    for notification in notifications:
        target_count = calculate_target_count(db, notification)
        
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "target_role": notification.target_role,
            "target_user_id": notification.target_user_id,
            "target_department": notification.target_department,
            "target_semester": notification.target_semester,
            "priority": notification.priority,
            "is_active": notification.is_active,
            "created_by": notification.created_by,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "target_count": target_count
        })
    
    return {
        "total_notifications": len(notification_data),
        "notifications": notification_data
    }


# ============= PROFESSOR SPECIFIC ENDPOINTS =============

@router.post("/professor/create")
def create_professor_notification(
    notification_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create notification by professor (limited scope)"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can create notifications")
    
    # Validate required fields
    if not notification_data.get("title") or not notification_data.get("message"):
        raise HTTPException(status_code=400, detail="Title and message are required")
    
    # Professors have limited targeting options
    allowed_target_roles = ["student", None]  # Can target students or make global
    target_role = notification_data.get("target_role")
    
    if target_role and target_role not in allowed_target_roles:
        raise HTTPException(
            status_code=403, 
            detail="Professors can only create notifications for students or global notifications"
        )
    
    # Create notification
    db_notification = NotificationModel(
        title=notification_data["title"],
        message=notification_data["message"],
        notification_type=notification_data.get("notification_type", "general"),
        target_role=target_role,
        target_department=notification_data.get("target_department"),
        target_semester=notification_data.get("target_semester"),
        priority=notification_data.get("priority", "normal"),
        created_by=current_user.user_id
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Calculate target count
    target_count = calculate_target_count(db, db_notification)
    
    return {
        "id": db_notification.id,
        "title": db_notification.title,
        "message": db_notification.message,
        "notification_type": db_notification.notification_type,
        "target_role": db_notification.target_role,
        "target_department": db_notification.target_department,
        "target_semester": db_notification.target_semester,
        "target_count": target_count,
        "created_at": db_notification.created_at,
        "message_status": "Notification created successfully"
    }


@router.post("/professor/create-class-notification")
def create_class_notification(
    notification_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create notification for a specific class (Professor only)"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can create class notifications")
    
    # Validate required fields
    if not notification_data.get("title") or not notification_data.get("message"):
        raise HTTPException(status_code=400, detail="Title and message are required")
    
    # Validate class targeting
    department_code = notification_data.get("department_code")
    semester = notification_data.get("semester")
    section = notification_data.get("section", "A")
    
    if not department_code or not semester:
        raise HTTPException(status_code=400, detail="Department code and semester are required for class notifications")
    
    # Verify professor teaches this class (optional - you can add this validation)
    # For now, we'll allow any professor to send notifications to any class
    
    # Create notification
    db_notification = NotificationModel(
        title=notification_data["title"],
        message=notification_data["message"],
        notification_type=notification_data.get("notification_type", "general"),
        target_role="student",  # Always target students for class notifications
        target_department=department_code,
        target_semester=int(semester),
        priority=notification_data.get("priority", "normal"),
        created_by=current_user.user_id
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Calculate target count (students in this specific class)
    target_count = calculate_class_target_count(db, department_code, semester, section)
    
    return {
        "id": db_notification.id,
        "title": db_notification.title,
        "message": db_notification.message,
        "notification_type": db_notification.notification_type,
        "target_class": f"{department_code} Semester {semester} Section {section}",
        "target_department": db_notification.target_department,
        "target_semester": db_notification.target_semester,
        "target_count": target_count,
        "created_at": db_notification.created_at,
        "message_status": "Class notification created successfully"
    }


@router.get("/professor/my-classes")
def get_professor_classes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get classes taught by current professor"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    # Get timetable entries for this professor
    from models.models import Timetable
    timetable_entries = db.query(Timetable).filter(
        Timetable.professor_usn == current_user.user_id
    ).all()
    
    # Group by class (department + semester + section)
    classes = {}
    for entry in timetable_entries:
        if entry.department_code and entry.semester:
            class_key = f"{entry.department_code}_{entry.semester}_{entry.section or 'A'}"
            if class_key not in classes:
                classes[class_key] = {
                    "department_code": entry.department_code,
                    "semester": entry.semester,
                    "section": entry.section or "A",
                    "class_name": f"{entry.department_code} Semester {entry.semester} Section {entry.section or 'A'}",
                    "subjects": set(),
                    "total_periods": 0
                }
            
            if entry.subject_code:
                classes[class_key]["subjects"].add(entry.subject_code)
            classes[class_key]["total_periods"] += 1
    
    # Convert sets to lists for JSON serialization
    class_list = []
    for class_info in classes.values():
        class_info["subjects"] = list(class_info["subjects"])
        class_info["subject_count"] = len(class_info["subjects"])
        class_list.append(class_info)
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "total_classes": len(class_list),
        "classes": class_list
    }


@router.get("/professor/my-notifications")
def get_professor_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications created by current professor"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    notifications = db.query(NotificationModel).filter(
        NotificationModel.created_by == current_user.user_id
    ).order_by(NotificationModel.created_at.desc()).all()
    
    notification_data = []
    for notification in notifications:
        target_count = calculate_target_count(db, notification)
        
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "target_role": notification.target_role,
            "target_department": notification.target_department,
            "target_semester": notification.target_semester,
            "priority": notification.priority,
            "is_active": notification.is_active,
            "created_at": notification.created_at,
            "target_count": target_count
        })
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "total_notifications": len(notification_data),
        "notifications": notification_data
    }


# ============= STUDENT SPECIFIC ENDPOINTS =============

@router.get("/student/my-notifications")
def get_student_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Parse student USN to get department info (if possible)
    try:
        from utils.usn_utils import parse_usn
        usn_components = parse_usn(current_user.user_id)
        student_department = usn_components.get('department_code')
    except:
        student_department = None
    
    # Get notifications for this student
    query = db.query(NotificationModel).filter(
        NotificationModel.is_active == True
    ).filter(
        # Notifications targeted to this student specifically
        (NotificationModel.target_user_id == current_user.user_id) |
        # Notifications targeted to all students
        (NotificationModel.target_role == "student") |
        # Global notifications
        (NotificationModel.target_role.is_(None))
    )
    
    # Add department filter if we can determine it
    if student_department:
        query = query.filter(
            (NotificationModel.target_department == student_department) |
            (NotificationModel.target_department.is_(None))
        )
    
    notifications = query.order_by(NotificationModel.created_at.desc()).limit(50).all()
    
    notification_data = []
    for notification in notifications:
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "priority": notification.priority,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "created_by": notification.created_by
        })
    
    return {
        "student_usn": current_user.user_id,
        "student_name": current_user.full_name,
        "student_department": student_department,
        "total_notifications": len(notification_data),
        "notifications": notification_data
    }


# ============= UTILITY FUNCTIONS =============

def calculate_target_count(db: Session, notification: NotificationModel) -> int:
    """Calculate estimated target count for a notification"""
    
    if notification.target_user_id:
        # Specific user
        return 1
    
    if notification.target_role == "admin":
        # Estimate admin count
        admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        return admin_count
    
    if notification.target_role == "professor":
        # Estimate professor count
        professor_count = db.query(User).filter(User.role == "professor", User.is_active == True).count()
        return professor_count
    
    if notification.target_role == "student":
        # Estimate student count
        student_count = db.query(User).filter(User.role == "student", User.is_active == True).count()
        
        # If department is specified, estimate based on department
        if notification.target_department:
            # Rough estimate: assume each department has about 240 students (60 per year * 4 years)
            return min(student_count, 240)
        
        return student_count
    
    # Global notification - estimate total active users
    total_users = db.query(User).filter(User.is_active == True).count()
    return total_users


def calculate_class_target_count(db: Session, department_code: str, semester: int, section: str = "A") -> int:
    """Calculate target count for a specific class"""
    
    # Count students in the specific department
    # This is an estimate since we don't have exact class enrollment data
    # In a real system, you'd have a student enrollment table
    
    students_in_dept = db.query(User).filter(
        User.role == "student",
        User.department_code == department_code,
        User.is_active == True
    ).count()
    
    # Estimate: assume each semester has about 30-60 students per section
    # and there are typically 8 semesters
    estimated_per_semester = max(1, students_in_dept // 8)  # Divide by 8 semesters
    
    return min(estimated_per_semester, 60)  # Cap at 60 students per class