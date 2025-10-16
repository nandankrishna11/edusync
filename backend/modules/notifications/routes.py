from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models.notification_model import NotificationModel
from schemas.notification_schema import NotificationResponse, NotificationCreate, NotificationUpdate

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    notification_type: Optional[str] = Query(None, description="Filter by type: cancellation, resource, notice"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    db: Session = Depends(get_db)
):
    """Get notifications with optional filtering"""
    query = db.query(NotificationModel)
    
    if class_id:
        query = query.filter(NotificationModel.class_id == class_id)
    if student_id:
        query = query.filter(
            (NotificationModel.student_id == student_id) | 
            (NotificationModel.student_id.is_(None))
        )
    if notification_type:
        query = query.filter(NotificationModel.type == notification_type)
    if is_read is not None:
        query = query.filter(NotificationModel.is_read == is_read)
    
    notifications = query.order_by(NotificationModel.created_at.desc()).limit(limit).all()
    return notifications

@router.post("/", response_model=NotificationResponse)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    """Create a new notification"""
    db_notification = NotificationModel(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a notification as read"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}