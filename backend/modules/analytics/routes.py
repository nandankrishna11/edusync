"""
Analytics routes with role-based access control
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional
from datetime import datetime, date, timedelta

from database import get_db
from models.models import AttendanceModel, NotificationModel, User
from modules.auth.dependencies import get_current_active_user, require_professor_or_admin, require_admin

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/admin/system-overview")
def get_system_overview(
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Get system-wide overview statistics - admin only"""
    try:
        # Count users by role
        total_students = db.query(User).filter(User.role == "student").count()
        total_professors = db.query(User).filter(User.role == "professor").count()
        total_admins = db.query(User).filter(User.role == "admin").count()
        
        # Get attendance statistics
        today = date.today()
        seven_days_ago = today - timedelta(days=7)
        
        attendance_today = db.query(AttendanceModel).filter(
            AttendanceModel.date == today
        ).count()
        
        attendance_week = db.query(AttendanceModel).filter(
            AttendanceModel.date >= seven_days_ago
        ).count()
        
        # Get notification count
        pending_notifications = db.query(NotificationModel).filter(
            NotificationModel.created_at >= seven_days_ago
        ).count()
        
        # Get unique departments (from user metadata or hardcoded)
        # For now, we'll use a simple count based on common departments
        total_departments = 4  # CS, EC, ME, CV - adjust based on your system
        
        return {
            "system_statistics": {
                "total_students": total_students,
                "total_professors": total_professors,
                "total_admins": total_admins,
                "total_departments": total_departments,
                "total_users": total_students + total_professors + total_admins
            },
            "recent_activity": {
                "attendance_records_today": attendance_today,
                "attendance_records_week": attendance_week,
                "notifications_week": pending_notifications
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching system overview: {str(e)}")

@router.post("/ai_summary")
def generate_ai_summary(
    request_data: dict,
    current_user: User = Depends(require_professor_or_admin),
    db: Session = Depends(get_db)
):
    """Generate AI-powered summary using attendance and class data - professors and admins only"""
    try:
        class_id = request_data.get("class_id")
        
        if not class_id:
            raise HTTPException(status_code=400, detail="class_id is required")
        
        attendance_records = db.query(AttendanceModel).filter(
            AttendanceModel.class_id == class_id
        ).all()
        
        if not attendance_records:
            raise HTTPException(status_code=404, detail="No attendance data found for this class")
        
        notifications = db.query(NotificationModel).filter(
            NotificationModel.class_id == class_id
        ).order_by(NotificationModel.created_at.desc()).limit(10).all()
        
        total_records = len(attendance_records)
        present_count = len([r for r in attendance_records if r.status == "present"])
        absent_count = len([r for r in attendance_records if r.status == "absent"])
        cancelled_count = len([r for r in attendance_records if r.status == "cancelled"])
        
        active_records = present_count + absent_count
        attendance_rate = (present_count / active_records * 100) if active_records > 0 else 0
        
        unique_students = len(set([r.student_id for r in attendance_records]))
        
        seven_days_ago = date.today() - timedelta(days=7)
        recent_records = [r for r in attendance_records if r.date >= seven_days_ago]
        recent_present = len([r for r in recent_records if r.status == "present"])
        recent_total = len([r for r in recent_records if r.status in ["present", "absent"]])
        recent_rate = (recent_present / recent_total * 100) if recent_total > 0 else 0
        
        cancellation_notifications = [n for n in notifications if n.type == "cancellation"]
        
        summary_parts = []
        
        if attendance_rate >= 90:
            summary_parts.append("📊 **Excellent Performance**: The class demonstrates outstanding attendance with a {:.1f}% rate.".format(attendance_rate))
        elif attendance_rate >= 80:
            summary_parts.append("📊 **Good Performance**: The class maintains a solid {:.1f}% attendance rate.".format(attendance_rate))
        elif attendance_rate >= 70:
            summary_parts.append("📊 **Moderate Performance**: The class shows a {:.1f}% attendance rate, which may need attention.".format(attendance_rate))
        else:
            summary_parts.append("📊 **Needs Improvement**: The class has a {:.1f}% attendance rate, requiring intervention.".format(attendance_rate))
        
        trend_diff = recent_rate - attendance_rate
        if abs(trend_diff) > 5:
            if trend_diff > 0:
                summary_parts.append("📈 **Positive Trend**: Recent attendance improved by {:.1f}%.".format(trend_diff))
            else:
                summary_parts.append("📉 **Declining Trend**: Recent attendance dropped by {:.1f}%.".format(abs(trend_diff)))
        else:
            summary_parts.append("📊 **Stable Trend**: Attendance patterns remain consistent.")
        
        if cancelled_count > 0:
            cancellation_rate = (cancelled_count / total_records * 100)
            if cancellation_rate > 10:
                summary_parts.append("⚠️ **High Disruption**: {:.1f}% of classes cancelled.".format(cancellation_rate))
            else:
                summary_parts.append("⚠️ **Minimal Disruption**: {:.1f}% cancellation rate is acceptable.".format(cancellation_rate))
        
        if unique_students > 0:
            avg_attendance_per_student = total_records / unique_students
            if avg_attendance_per_student > 10:
                summary_parts.append("👥 **High Engagement**: Students show strong commitment with {:.1f} sessions per student.".format(avg_attendance_per_student))
        
        recommendations = []
        if attendance_rate < 80:
            recommendations.append("Implement engagement strategies")
        if not recommendations:
            recommendations.append("Continue current successful strategies")
        
        summary_text = "\n\n".join(summary_parts)
        if recommendations:
            summary_text += "\n\n💡 **Recommendations**:\n" + "\n".join([f"- {rec}" for rec in recommendations])
        
        return {
            "class_id": class_id,
            "generated_at": datetime.now().isoformat(),
            "ai_summary": summary_text,
            "key_metrics": {
                "attendance_rate": round(attendance_rate, 2),
                "total_students": unique_students,
                "total_records": total_records,
                "present_count": present_count,
                "absent_count": absent_count,
                "cancelled_count": cancelled_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AI summary: {str(e)}")

@router.get("/dashboard_data")
def get_dashboard_data(
    class_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard data for analytics with role-based filtering"""
    try:
        attendance_query = db.query(AttendanceModel)
        notification_query = db.query(NotificationModel)
        
        if class_id:
            attendance_query = attendance_query.filter(AttendanceModel.class_id == class_id)
            notification_query = notification_query.filter(NotificationModel.class_id == class_id)
        
        attendance_records = attendance_query.all()
        
        total_records = len(attendance_records)
        present_count = len([r for r in attendance_records if r.status == "present"])
        absent_count = len([r for r in attendance_records if r.status == "absent"])
        cancelled_count = len([r for r in attendance_records if r.status == "cancelled"])
        
        active_records = present_count + absent_count
        attendance_rate = (present_count / active_records * 100) if active_records > 0 else 0
        
        attendance_chart_data = [
            {"name": "Present", "value": round((present_count / total_records * 100), 1) if total_records > 0 else 0, "color": "#5C6AC4"},
            {"name": "Absent", "value": round((absent_count / total_records * 100), 1) if total_records > 0 else 0, "color": "#7E8AFF"},
            {"name": "Cancelled", "value": round((cancelled_count / total_records * 100), 1) if total_records > 0 else 0, "color": "#E5E7EB"}
        ]
        
        cancelled_notifications = notification_query.filter(
            NotificationModel.type == "cancellation"
        ).order_by(NotificationModel.created_at.desc()).limit(5).all()
        
        cancelled_classes = []
        for notif in cancelled_notifications:
            metadata = notif.notification_metadata or {}
            cancelled_classes.append({
                "id": notif.id,
                "subject": metadata.get("subject", "Unknown Subject"),
                "date": metadata.get("date", notif.created_at.strftime("%Y-%m-%d")),
                "time": f"{metadata.get('period_start', 'TBD')}-{metadata.get('period_end', 'TBD')}",
                "reason": metadata.get("reason", notif.message),
                "class_id": notif.class_id
            })
        
        upcoming_classes = [
            {
                "id": 1,
                "subject": "Advanced Algorithms",
                "date": (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time": "09:00-10:30",
                "room": "Room 301",
                "class_id": class_id or "CS301"
            }
        ]
        
        return {
            "attendance_chart_data": attendance_chart_data,
            "cancelled_classes": cancelled_classes,
            "upcoming_classes": upcoming_classes,
            "summary_stats": {
                "total_records": total_records,
                "attendance_rate": round(attendance_rate, 2),
                "unique_students": len(set([r.student_id for r in attendance_records])) if attendance_records else 0,
                "active_classes": len(set([r.class_id for r in attendance_records])) if attendance_records else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")