#!/bin/bash

echo "========================================"
echo "Starting Classroom Management System"
echo "========================================"
echo ""

# Check if setup was run
if [ ! -d "backend/venv" ]; then
    echo "ERROR: Backend virtual environment not found!"
    echo "Please run './setup.sh' first"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "ERROR: Frontend dependencies not found!"
    echo "Please run './setup.sh' first"
    exit 1
fi

echo "Starting Backend Server..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "Backend started (PID: $BACKEND_PID)"
echo ""

echo "Starting Frontend Server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "========================================"
echo "Servers are starting..."
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "========================================"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
