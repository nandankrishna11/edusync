from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from database import engine
from modules.auth.routes import router as auth_router
from modules.timetable.routes import router as timetable_router
from modules.attendance.routes import router as attendance_router
from modules.notifications.routes import router as notifications_router
from modules.analytics.routes import router as analytics_router
from modules.textbooks.routes import router as textbooks_router
from modules.textbooks.chat_routes import router as chat_router

# Create database tables
from models.models import (
    User, Timetable, AttendanceModel, EnhancedAttendance, 
    StudentMarks, StudentRegistry, SubjectMaster, 
    AttendanceSummary, MarksSummary, NotificationModel,
    Textbook, TextbookChunk, TextbookSearch, SavedAnswer,
    StudentSubjectOptIn, ChatSession, ChatMessage,
    StudentMark, Assignment, AssignmentSubmission
)

# Create all tables
User.metadata.create_all(bind=engine)
Timetable.metadata.create_all(bind=engine)
AttendanceModel.metadata.create_all(bind=engine)
EnhancedAttendance.metadata.create_all(bind=engine)
StudentMarks.metadata.create_all(bind=engine)
StudentRegistry.metadata.create_all(bind=engine)
SubjectMaster.metadata.create_all(bind=engine)
AttendanceSummary.metadata.create_all(bind=engine)
MarksSummary.metadata.create_all(bind=engine)
NotificationModel.metadata.create_all(bind=engine)
Textbook.metadata.create_all(bind=engine)
TextbookChunk.metadata.create_all(bind=engine)
TextbookSearch.metadata.create_all(bind=engine)
SavedAnswer.metadata.create_all(bind=engine)
StudentSubjectOptIn.metadata.create_all(bind=engine)
ChatSession.metadata.create_all(bind=engine)
ChatMessage.metadata.create_all(bind=engine)
StudentMark.metadata.create_all(bind=engine)
Assignment.metadata.create_all(bind=engine)
AssignmentSubmission.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Classroom + RAG Web App",
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(timetable_router, prefix="/api/timetable")
app.include_router(attendance_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(textbooks_router)
app.include_router(chat_router)

# Include enhanced modules
from modules.attendance.enhanced_routes import router as enhanced_attendance_router
from modules.notifications.enhanced_routes import router as enhanced_notifications_router
from modules.analytics.enhanced_routes import router as enhanced_analytics_router
from modules.timetable.enhanced_routes import router as enhanced_timetable_router
# from modules.marks.routes import router as marks_router  # DISABLED - Using new academic marks system
from modules.enhanced_attendance.routes import router as enhanced_attendance_marks_router

app.include_router(enhanced_attendance_router, prefix="/api")
app.include_router(enhanced_notifications_router, prefix="/api")
app.include_router(enhanced_analytics_router, prefix="/api")
app.include_router(enhanced_timetable_router, prefix="/api")
# app.include_router(marks_router, prefix="/api")  # DISABLED - Using new academic marks system
app.include_router(enhanced_attendance_marks_router, prefix="/api")

# Include new academic modules (marks, assignments)
from modules.academic.marks_routes import router as academic_marks_router
app.include_router(academic_marks_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Classroom RAG API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}