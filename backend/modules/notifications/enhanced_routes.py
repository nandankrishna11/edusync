"""
Enhanced Notification routes with role-based targeting and smart delivery
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models.models import NotificationModel, User, StudentRegistry, SubjectMaster
from schemas.schemas import NotificationCreate, NotificationResponse
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin
from utils.usn_utils import parse_usn, calculate_current_semester, get_department_name

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ============= ADMIN ENDPOINTS =============

@router.post("/admin/create")
async def create_notification(
    notification: NotificationCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new notification (Admin only)"""
    
    # Validate target based on type
    if notification.target_type == "department" and not notification.target_value:
        raise HTTPException(status_code=400, detail="Department code is required for department notifications")
    
    if notification.target_type == "semester" and not notification.target_value:
        raise HTTPException(status_code=400, detail="Semester number is required for semester notifications")
    
    if notification.target_type == "individual" and not notification.target_value:
        raise HTTPException(status_code=400, detail="Student USN is required for individual notifications")
    
    # Create notification
    new_notification = Notification(
        title=notification.title,
        message=notification.message,
        target_type=notification.target_type,
        target_value=notification.target_value,
        priority=notification.priority,
        notification_type=notification.notification_type,
        created_by=current_user.user_id,
        expires_at=notification.expires_at,
        is_pinned=notification.is_pinned
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    # Get target count for response
    target_count = await get_notification_target_count(db, new_notification)
    
    return {
        "id": new_notification.id,
        "title": new_notification.title,
        "target_type": new_notification.target_type,
        "target_value": new_notification.target_value,
        "target_count": target_count,
        "created_at": new_notification.created_at,
        "message": "Notification created successfully"
    }


@router.get("/admin/all")
async def get_all_notifications(
    target_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    notification_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    limit: int = Query(50, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all notifications with filters (Admin only)"""
    
    query = db.query(Notification)
    
    if target_type:
        query = query.filter(Notification.target_type == target_type)
    if priority:
        query = query.filter(Notification.priority == priority)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if is_active is not None:
        query = query.filter(Notification.is_active == is_active)
    
    notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
    
    # Add read statistics for each notification
    notification_data = []
    for notification in notifications:
        target_count = await get_notification_target_count(db, notification)
        read_count = await get_notification_read_count(db, notification.id)
        
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "target_type": notification.target_type,
            "target_value": notification.target_value,
            "priority": notification.priority,
            "notification_type": notification.notification_type,
            "created_by": notification.created_by,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "is_active": notification.is_active,
            "is_pinned": notification.is_pinned,
            "target_count": target_count,
            "read_count": read_count,
            "read_percentage": round((read_count / target_count * 100), 2) if target_count > 0 else 0
        })
    
    return {
        "total_notifications": len(notification_data),
        "notifications": notification_data
    }


@router.put("/admin/{notification_id}/toggle-active")
async def toggle_notification_active(
    notification_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Toggle notification active status"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_active = not notification.is_active
    db.commit()
    
    return {
        "id": notification.id,
        "is_active": notification.is_active,
        "message": f"Notification {'activated' if notification.is_active else 'deactivated'}"
    }


# ============= PROFESSOR ENDPOINTS =============

@router.post("/professor/create")
async def create_professor_notification(
    notification: NotificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create notification by professor (limited scope)"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can create notifications")
    
    # Professors can only create department or subject-specific notifications
    allowed_types = ["department", "semester"]
    if notification.target_type not in allowed_types:
        raise HTTPException(
            status_code=403, 
            detail="Professors can only create department or semester notifications"
        )
    
    # Verify professor has access to the target
    if notification.target_type == "department":
        # Check if professor teaches in this department
        professor_subjects = db.query(Subject).filter(
            Subject.professor_usn == current_user.user_id,
            Subject.department_code == notification.target_value
        ).first()
        
        if not professor_subjects:
            raise HTTPException(
                status_code=403,
                detail=f"You don't have permission to send notifications to department {notification.target_value}"
            )
    
    # Create notification
    new_notification = Notification(
        title=notification.title,
        message=notification.message,
        target_type=notification.target_type,
        target_value=notification.target_value,
        priority=notification.priority,
        notification_type=notification.notification_type,
        created_by=current_user.user_id,
        expires_at=notification.expires_at,
        is_pinned=False  # Professors cannot pin notifications
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    target_count = await get_notification_target_count(db, new_notification)
    
    return {
        "id": new_notification.id,
        "title": new_notification.title,
        "target_type": new_notification.target_type,
        "target_count": target_count,
        "message": "Notification created successfully"
    }


@router.get("/professor/my-notifications")
async def get_professor_notifications(
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications created by current professor"""
    
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can access this endpoint")
    
    notifications = db.query(Notification).filter(
        Notification.created_by == current_user.user_id,
        Notification.is_active == True
    ).order_by(desc(Notification.created_at)).limit(limit).all()
    
    notification_data = []
    for notification in notifications:
        target_count = await get_notification_target_count(db, notification)
        read_count = await get_notification_read_count(db, notification.id)
        
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "target_type": notification.target_type,
            "target_value": notification.target_value,
            "priority": notification.priority,
            "notification_type": notification.notification_type,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "target_count": target_count,
            "read_count": read_count,
            "read_percentage": round((read_count / target_count * 100), 2) if target_count > 0 else 0
        })
    
    return {
        "professor_usn": current_user.user_id,
        "professor_name": current_user.full_name,
        "total_notifications": len(notification_data),
        "notifications": notification_data
    }


# ============= STUDENT ENDPOINTS =============

@router.get("/student/my-notifications")
async def get_student_notifications(
    unread_only: bool = Query(False),
    priority: Optional[str] = Query(None),
    notification_type: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Parse USN to get student info
    parsed_usn = parse_usn(current_user.user_id)
    if not parsed_usn:
        raise HTTPException(status_code=400, detail="Invalid USN format")
    
    current_semester = calculate_current_semester(current_user.user_id)
    department_code = parsed_usn["department_code"]
    
    # Build query for relevant notifications
    query = db.query(Notification).filter(
        Notification.is_active == True,
        or_(
            Notification.expires_at.is_(None),
            Notification.expires_at > datetime.now()
        ),
        or_(
            # Global notifications
            Notification.target_type == "global",
            # Department notifications
            and_(
                Notification.target_type == "department",
                Notification.target_value == department_code
            ),
            # Semester notifications
            and_(
                Notification.target_type == "semester",
                Notification.target_value == str(current_semester)
            ),
            # Individual notifications
            and_(
                Notification.target_type == "individual",
                Notification.target_value == current_user.user_id
            )
        )
    )
    
    if priority:
        query = query.filter(Notification.priority == priority)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    
    notifications = query.order_by(
        desc(Notification.is_pinned),
        desc(Notification.priority == "urgent"),
        desc(Notification.priority == "high"),
        desc(Notification.created_at)
    ).limit(limit).all()
    
    # Get read status for each notification
    read_notifications = db.query(NotificationRead.notification_id).filter(
        NotificationRead.student_usn == current_user.user_id
    ).all()
    read_notification_ids = {r.notification_id for r in read_notifications}
    
    notification_data = []
    for notification in notifications:
        is_read = notification.id in read_notification_ids
        
        if unread_only and is_read:
            continue
        
        notification_data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "target_type": notification.target_type,
            "target_value": notification.target_value,
            "priority": notification.priority,
            "notification_type": notification.notification_type,
            "created_by": notification.created_by,
            "created_at": notification.created_at,
            "expires_at": notification.expires_at,
            "is_pinned": notification.is_pinned,
            "is_read": is_read
        })
    
    # Count unread notifications
    unread_count = len([n for n in notification_data if not n["is_read"]])
    
    return {
        "student_usn": current_user.user_id,
        "student_name": current_user.full_name,
        "department_code": department_code,
        "current_semester": current_semester,
        "total_notifications": len(notification_data),
        "unread_count": unread_count,
        "notifications": notification_data
    }


@router.post("/student/mark-read/{notification_id}")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can mark notifications as read")
    
    # Check if notification exists and is accessible to student
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check if student has access to this notification
    has_access = await check_student_notification_access(db, current_user.user_id, notification)
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have access to this notification")
    
    # Check if already marked as read
    existing_read = db.query(NotificationRead).filter(
        NotificationRead.notification_id == notification_id,
        NotificationRead.student_usn == current_user.user_id
    ).first()
    
    if existing_read:
        return {"message": "Notification already marked as read"}
    
    # Mark as read
    notification_read = NotificationRead(
        notification_id=notification_id,
        student_usn=current_user.user_id
    )
    
    db.add(notification_read)
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.post("/student/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all accessible notifications as read for current student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can mark notifications as read")
    
    # Parse USN to get student info
    parsed_usn = parse_usn(current_user.user_id)
    if not parsed_usn:
        raise HTTPException(status_code=400, detail="Invalid USN format")
    
    current_semester = calculate_current_semester(current_user.user_id)
    department_code = parsed_usn["department_code"]
    
    # Get all accessible notifications
    notifications = db.query(Notification).filter(
        Notification.is_active == True,
        or_(
            Notification.target_type == "global",
            and_(
                Notification.target_type == "department",
                Notification.target_value == department_code
            ),
            and_(
                Notification.target_type == "semester",
                Notification.target_value == str(current_semester)
            ),
            and_(
                Notification.target_type == "individual",
                Notification.target_value == current_user.user_id
            )
        )
    ).all()
    
    # Get already read notifications
    read_notifications = db.query(NotificationRead.notification_id).filter(
        NotificationRead.student_usn == current_user.user_id
    ).all()
    read_notification_ids = {r.notification_id for r in read_notifications}
    
    # Mark unread notifications as read
    new_reads = []
    for notification in notifications:
        if notification.id not in read_notification_ids:
            new_reads.append(NotificationRead(
                notification_id=notification.id,
                student_usn=current_user.user_id
            ))
    
    if new_reads:
        db.add_all(new_reads)
        db.commit()
    
    return {
        "message": f"Marked {len(new_reads)} notifications as read",
        "marked_count": len(new_reads)
    }


# ============= UTILITY FUNCTIONS =============

async def get_notification_target_count(db: Session, notification: NotificationModel) -> int:
    """Get the number of users targeted by a notification"""
    
    if notification.target_type == "global":
        # Count all active students
        return db.query(Student).filter(Student.is_active == True).count()
    
    elif notification.target_type == "department":
        # Count students in specific department
        return db.query(Student).filter(
            Student.department_code == notification.target_value,
            Student.is_active == True
        ).count()
    
    elif notification.target_type == "semester":
        # Count students in specific semester
        return db.query(Student).filter(
            Student.current_semester == int(notification.target_value),
            Student.is_active == True
        ).count()
    
    elif notification.target_type == "individual":
        # Individual notification - count is 1 if student exists
        student = db.query(Student).filter(
            Student.usn == notification.target_value,
            Student.is_active == True
        ).first()
        return 1 if student else 0
    
    return 0


async def get_notification_read_count(db: Session, notification_id: int) -> int:
    """Get the number of users who have read a notification"""
    return db.query(NotificationRead).filter(
        NotificationRead.notification_id == notification_id
    ).count()


async def check_student_notification_access(db: Session, student_usn: str, notification: NotificationModel) -> bool:
    """Check if a student has access to a specific notification"""
    
    if notification.target_type == "global":
        return True
    
    elif notification.target_type == "individual":
        return notification.target_value == student_usn
    
    else:
        # Get student info
        parsed_usn = parse_usn(student_usn)
        if not parsed_usn:
            return False
        
        if notification.target_type == "department":
            return notification.target_value == parsed_usn["department_code"]
        
        elif notification.target_type == "semester":
            current_semester = calculate_current_semester(student_usn)
            return notification.target_value == str(current_semester)
    
    return False


# ============= ANALYTICS ENDPOINTS =============

@router.get("/analytics/notification-stats")
async def get_notification_analytics(
    days: int = Query(30, le=365),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get notification analytics (Admin only)"""
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Get notifications in date range
    notifications = db.query(Notification).filter(
        Notification.created_at >= start_date
    ).all()
    
    # Calculate statistics
    total_notifications = len(notifications)
    active_notifications = len([n for n in notifications if n.is_active])
    
    # Group by type
    type_stats = {}
    priority_stats = {}
    target_stats = {}
    
    for notification in notifications:
        # Type statistics
        if notification.notification_type not in type_stats:
            type_stats[notification.notification_type] = 0
        type_stats[notification.notification_type] += 1
        
        # Priority statistics
        if notification.priority not in priority_stats:
            priority_stats[notification.priority] = 0
        priority_stats[notification.priority] += 1
        
        # Target statistics
        if notification.target_type not in target_stats:
            target_stats[notification.target_type] = 0
        target_stats[notification.target_type] += 1
    
    # Get read statistics
    total_reads = db.query(NotificationRead).join(Notification).filter(
        Notification.created_at >= start_date
    ).count()
    
    return {
        "date_range": {
            "start_date": start_date,
            "end_date": datetime.now(),
            "days": days
        },
        "overall_stats": {
            "total_notifications": total_notifications,
            "active_notifications": active_notifications,
            "total_reads": total_reads
        },
        "breakdown": {
            "by_type": type_stats,
            "by_priority": priority_stats,
            "by_target": target_stats
        }
    }