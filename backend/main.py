from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from database import engine
from models.class_model import ClassModel
from models.timetable_model import TimetableModel
from models.notification_model import NotificationModel
from models.attendance_model import AttendanceModel
from modules.auth.routes import router as auth_router
from modules.timetable.routes import router as timetable_router
from modules.attendance.routes import router as attendance_router
from modules.notifications.routes import router as notifications_router
from modules.analytics.routes import router as analytics_router

# Create database tables
ClassModel.metadata.create_all(bind=engine)
TimetableModel.metadata.create_all(bind=engine)
NotificationModel.metadata.create_all(bind=engine)
AttendanceModel.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Classroom + RAG Web App",
    version=settings.VERSION
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(timetable_router, prefix="/api/timetable")
app.include_router(attendance_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Classroom RAG API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}