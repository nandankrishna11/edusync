"""
Notifications routes with role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models.notification_model import NotificationModel
from .schemas import NotificationResponse, NotificationCreate, NotificationUpdate
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin
from modules.auth.models import User

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    target_usn: Optional[str] = Query(None, description="Filter by target student USN"),
    notification_type: Optional[str] = Query(None, description="Filter by type: cancellation, resource, notice"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications with role-based filtering"""
    query = db.query(NotificationModel)
    
    # Role-based filtering
    if current_user.role == "student":
        # Students can only see notifications for them or general notifications
        query = query.filter(
            (NotificationModel.target_usn == current_user.user_id) | 
            (NotificationModel.target_usn.is_(None))
        )
    elif current_user.role == "professor":
        # Professors can see all notifications for their classes
        pass  # No additional filtering needed
    # Admins can see all notifications
    
    if class_id:
        query = query.filter(NotificationModel.class_id == class_id)
    if target_usn and current_user.role in ["professor", "admin"]:
        query = query.filter(
            (NotificationModel.target_usn == target_usn) | 
            (NotificationModel.target_usn.is_(None))
        )
    if notification_type:
        query = query.filter(NotificationModel.type == notification_type)
    if is_read is not None:
        query = query.filter(NotificationModel.is_read == is_read)
    
    notifications = query.order_by(NotificationModel.created_at.desc()).limit(limit).all()
    return notifications

@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification: NotificationCreate, 
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new notification - professors and admins only"""
    db_notification = NotificationModel(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read - accessible to all authenticated users"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Students can only mark their own notifications as read
    if current_user.role == "student":
        if notification.target_usn and notification.target_usn != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this notification")
    
    notification.is_read = True
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
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}