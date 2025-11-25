@echo off
echo ========================================
echo Classroom Management System - Setup
echo ========================================
echo.

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo.

echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
npm --version
echo.

echo [3/6] Setting up Backend...
cd backend

echo Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing backend dependencies...
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo Installing AI/RAG dependencies...
pip install -r requirements_textbooks.txt
if errorlevel 1 (
    echo WARNING: Failed to install textbook dependencies
    echo AI features may not work properly
)

echo Creating necessary folders...
if not exist "uploads" mkdir uploads
if not exist "uploads\pdfs" mkdir uploads\pdfs
if not exist "chroma_db" mkdir chroma_db

echo Setting up environment file...
if not exist ".env" (
    copy ..\\.env.example .env
    echo Created .env file - please update with your settings
)

cd ..
echo.

echo [4/6] Setting up Frontend...
cd frontend

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Setting up frontend environment...
if not exist ".env" (
    echo REACT_APP_API_URL=http://localhost:8000 > .env
    echo Created frontend .env file
)

cd ..
echo.

echo [5/6] Verifying setup...
if exist "backend\venv\Scripts\python.exe" (
    echo [OK] Backend virtual environment created
) else (
    echo [FAIL] Backend virtual environment missing
)

if exist "frontend\node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [FAIL] Frontend dependencies missing
)

if exist "backend\.env" (
    echo [OK] Backend environment file exists
) else (
    echo [WARN] Backend .env file missing
)

echo.
echo [6/6] Setup Complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Review backend\.env file and update if needed
echo 2. Run 'start-all.bat' to start the application
echo 3. Open http://localhost:3000 in your browser
echo 4. Login with default credentials (see README.md)
echo.
echo Default Admin Login:
echo   Username: admin
echo   Password: admin123
echo ========================================
echo.
pause
