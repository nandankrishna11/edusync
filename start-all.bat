@echo off
title Classroom Management System
echo ========================================
echo    Classroom Management System
echo ========================================
echo.
echo Starting both servers...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop servers
echo.

start "Backend Server" cmd /k "cd backend && call venv\Scripts\activate && venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ Both servers are starting...
echo ✅ Backend: http://localhost:8000
echo ✅ Frontend: http://localhost:3000
echo.
echo Default login credentials:
echo   Admin: admin / admin123
echo   Professor: prof_smith / prof123
echo   Student: student_john / student123
echo.
echo Both servers will open in separate windows.
echo Close those windows to stop the servers.
echo.
pause