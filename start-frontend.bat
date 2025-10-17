@echo off
title Classroom Frontend Server
echo ========================================
echo  Classroom Management System Frontend
echo ========================================
echo.
echo Starting frontend server...
echo Frontend will be available at: http://localhost:3000
echo.
echo Make sure the backend is also running!
echo Backend: http://localhost:8000
echo.
cd frontend
npm start
pause