#!/bin/bash

echo "========================================"
echo "Classroom Management System - Setup"
echo "========================================"
echo ""

echo "[1/6] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi
python3 --version
echo ""

echo "[2/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
node --version
npm --version
echo ""

echo "[3/6] Setting up Backend..."
cd backend

echo "Creating Python virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create virtual environment"
    exit 1
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi

echo "Installing AI/RAG dependencies..."
pip install -r requirements_textbooks.txt
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to install textbook dependencies"
    echo "AI features may not work properly"
fi

echo "Creating necessary folders..."
mkdir -p uploads/pdfs
mkdir -p chroma_db

echo "Setting up environment file..."
if [ ! -f ".env" ]; then
    cp ../.env.example .env
    echo "Created .env file - please update with your settings"
fi

cd ..
echo ""

echo "[4/6] Setting up Frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi

echo "Setting up frontend environment..."
if [ ! -f ".env" ]; then
    echo "REACT_APP_API_URL=http://localhost:8000" > .env
    echo "Created frontend .env file"
fi

cd ..
echo ""

echo "[5/6] Verifying setup..."
if [ -f "backend/venv/bin/python" ]; then
    echo "[OK] Backend virtual environment created"
else
    echo "[FAIL] Backend virtual environment missing"
fi

if [ -d "frontend/node_modules" ]; then
    echo "[OK] Frontend dependencies installed"
else
    echo "[FAIL] Frontend dependencies missing"
fi

if [ -f "backend/.env" ]; then
    echo "[OK] Backend environment file exists"
else
    echo "[WARN] Backend .env file missing"
fi

echo ""
echo "[6/6] Setup Complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo "1. Review backend/.env file and update if needed"
echo "2. Run './start-all.sh' to start the application"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Login with default credentials (see README.md)"
echo ""
echo "Default Admin Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo "========================================"
echo ""
