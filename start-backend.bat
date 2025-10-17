@echo off
title Classroom Backend Server
echo ========================================
echo   Classroom Management System Backend
echo ========================================
echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Default login credentials:
echo   Admin: admin / admin123
echo   Professor: prof_smith / prof123
echo   Student: student_john / student123
echo.
cd backend
call venv\Scripts\activate
echo Virtual environment activated
venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause