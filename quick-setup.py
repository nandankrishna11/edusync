#!/usr/bin/env python3
"""
One-click setup script for the Classroom Management System
Handles all dependencies and setup automatically
"""
import os
import subprocess
import sys
import time
from pathlib import Path

def print_step(step, message):
    """Print formatted step message"""
    print(f"\n{'='*60}")
    print(f"STEP {step}: {message}")
    print('='*60)

def run_command(command, cwd=None, description=""):
    """Run a command with better error handling"""
    try:
        print(f"Running: {command}")
        if description:
            print(f"Purpose: {description}")
        
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=True,
            capture_output=True, 
            text=True,
            timeout=300  # 5 minute timeout
        )
        print("✅ Success!")
        return True
    except subprocess.TimeoutExpired:
        print(f"❌ Timeout: Command took too long")
        return False
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def check_prerequisites():
    """Check if required tools are installed"""
    print_step(1, "Checking Prerequisites")
    
    # Check Python
    try:
        python_version = subprocess.check_output([sys.executable, "--version"], text=True).strip()
        print(f"✅ {python_version}")
    except:
        print("❌ Python not found!")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()}")
        else:
            raise Exception("Node.js not working")
    except:
        print("❌ Node.js not found! Please install Node.js 16+ from https://nodejs.org/")
        return False
    
    # Check npm
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()}")
        else:
            raise Exception("npm not working")
    except:
        print("❌ npm not found!")
        return False
    
    return True

def setup_backend():
    """Setup backend with all dependencies"""
    print_step(2, "Setting up Backend")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Create virtual environment
    venv_path = backend_dir / "venv"
    if not venv_path.exists():
        if not run_command(f"{sys.executable} -m venv venv", cwd=backend_dir, 
                          description="Creating Python virtual environment"):
            return False
    else:
        print("✅ Virtual environment already exists")
    
    # Determine activation script and python path
    if os.name == 'nt':  # Windows
        python_exe = venv_path / "Scripts" / "python.exe"
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:  # Unix/Linux/macOS
        python_exe = venv_path / "bin" / "python"
        pip_exe = venv_path / "bin" / "pip"
    
    # Upgrade pip
    if not run_command(f'"{pip_exe}" install --upgrade pip', cwd=backend_dir,
                      description="Upgrading pip to latest version"):
        print("⚠️ Pip upgrade failed, continuing anyway...")
    
    # Install dependencies
    if not run_command(f'"{pip_exe}" install -r requirements.txt', cwd=backend_dir,
                      description="Installing Python dependencies"):
        return False
    
    # Initialize database and auth system
    if not run_command(f'"{python_exe}" init_auth.py', cwd=backend_dir,
                      description="Setting up database and default users"):
        return False
    
    print("✅ Backend setup complete!")
    return True

def setup_frontend():
    """Setup frontend with all dependencies"""
    print_step(3, "Setting up Frontend")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    # Clean install
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists():
        print("🧹 Cleaning existing node_modules...")
        if os.name == 'nt':
            run_command("rmdir /s /q node_modules", cwd=frontend_dir)
        else:
            run_command("rm -rf node_modules", cwd=frontend_dir)
    
    # Install dependencies
    if not run_command("npm install", cwd=frontend_dir,
                      description="Installing Node.js dependencies"):
        return False
    
    print("✅ Frontend setup complete!")
    return True

def create_startup_scripts():
    """Create easy startup scripts"""
    print_step(4, "Creating Startup Scripts")
    
    # Windows batch files
    if os.name == 'nt':
        # Backend startup script
        backend_script = """@echo off
title Classroom Backend Server
echo ========================================
echo   Classroom Management System Backend
echo ========================================
echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
cd backend
call venv\\Scripts\\activate
echo Virtual environment activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
"""
        
        frontend_script = """@echo off
title Classroom Frontend Server
echo ========================================
echo  Classroom Management System Frontend
echo ========================================
echo.
echo Starting frontend server...
echo Frontend will be available at: http://localhost:3000
echo.
cd frontend
npm start
pause
"""
        
        # Combined startup script
        combined_script = """@echo off
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

start "Backend Server" cmd /k "cd backend && call venv\\Scripts\\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
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
pause
"""
        
        with open("start-backend.bat", "w") as f:
            f.write(backend_script)
        
        with open("start-frontend.bat", "w") as f:
            f.write(frontend_script)
            
        with open("start-all.bat", "w") as f:
            f.write(combined_script)
            
        print("✅ Created Windows batch files:")
        print("   - start-backend.bat")
        print("   - start-frontend.bat") 
        print("   - start-all.bat (starts both servers)")
    
    # Unix shell scripts
    else:
        backend_script = """#!/bin/bash
echo "========================================"
echo "  Classroom Management System Backend"
echo "========================================"
echo
echo "Starting backend server..."
echo "Backend will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo
cd backend
source venv/bin/activate
echo "Virtual environment activated"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
        
        frontend_script = """#!/bin/bash
echo "========================================"
echo " Classroom Management System Frontend"
echo "========================================"
echo
echo "Starting frontend server..."
echo "Frontend will be available at: http://localhost:3000"
echo
cd frontend
npm start
"""
        
        combined_script = """#!/bin/bash
echo "========================================"
echo "   Classroom Management System"
echo "========================================"
echo
echo "Starting both servers..."
echo
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo

# Start backend in background
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "✅ Both servers are starting..."
echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:3000"
echo
echo "Default login credentials:"
echo "  Admin: admin / admin123"
echo "  Professor: prof_smith / prof123"
echo "  Student: student_john / student123"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
"""
        
        with open("start-backend.sh", "w") as f:
            f.write(backend_script)
        os.chmod("start-backend.sh", 0o755)
        
        with open("start-frontend.sh", "w") as f:
            f.write(frontend_script)
        os.chmod("start-frontend.sh", 0o755)
            
        with open("start-all.sh", "w") as f:
            f.write(combined_script)
        os.chmod("start-all.sh", 0o755)
            
        print("✅ Created Unix shell scripts:")
        print("   - start-backend.sh")
        print("   - start-frontend.sh")
        print("   - start-all.sh (starts both servers)")

def main():
    """Main setup function"""
    print("🚀 Classroom Management System - Quick Setup")
    print("=" * 60)
    print("This script will automatically set up everything you need!")
    print()
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites check failed!")
        print("Please install the missing requirements and try again.")
        return False
    
    # Setup backend
    if not setup_backend():
        print("\n❌ Backend setup failed!")
        return False
    
    # Setup frontend  
    if not setup_frontend():
        print("\n❌ Frontend setup failed!")
        return False
    
    # Create startup scripts
    create_startup_scripts()
    
    # Success message
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    
    if os.name == 'nt':
        print("\n📝 How to run your application:")
        print("   Option 1: Double-click 'start-all.bat' (starts both servers)")
        print("   Option 2: Double-click 'start-backend.bat' and 'start-frontend.bat' separately")
    else:
        print("\n📝 How to run your application:")
        print("   Option 1: ./start-all.sh (starts both servers)")
        print("   Option 2: ./start-backend.sh and ./start-frontend.sh separately")
    
    print("\n🌐 Access your application:")
    print("   Frontend: http://localhost:3000")
    print("   Backend API: http://localhost:8000")
    print("   API Documentation: http://localhost:8000/docs")
    
    print("\n🔑 Default login credentials:")
    print("   Admin: admin / admin123")
    print("   Professor: prof_smith / prof123")
    print("   Student: student_john / student123")
    
    print("\n💡 Tips:")
    print("   - Both servers will auto-reload when you make code changes")
    print("   - Press Ctrl+C in the terminal windows to stop the servers")
    print("   - Check the API docs at /docs for backend endpoints")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error during setup: {e}")
        sys.exit(1)