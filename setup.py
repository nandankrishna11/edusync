#!/usr/bin/env python3
"""
Quick setup script for the Classroom Management System
"""
import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False

def setup_backend():
    """Setup backend environment"""
    print("\n🔧 Setting up backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Create virtual environment
    if not run_command("python -m venv venv", cwd=backend_dir):
        return False
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
        python_command = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        activate_script = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
        python_command = "venv/bin/python"
    
    # Install dependencies
    if not run_command(f"{pip_command} install -r requirements.txt", cwd=backend_dir):
        return False
    
    # Initialize auth system
    if not run_command(f"{python_command} init_auth.py", cwd=backend_dir):
        return False
    
    print("✅ Backend setup complete!")
    return True

def setup_frontend():
    """Setup frontend environment"""
    print("\n🎨 Setting up frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    # Install dependencies
    if not run_command("npm install", cwd=frontend_dir):
        return False
    
    print("✅ Frontend setup complete!")
    return True

def main():
    """Main setup function"""
    print("🚀 Classroom Management System Setup")
    print("=" * 50)
    
    # Check prerequisites
    print("\n📋 Checking prerequisites...")
    
    # Check Python
    try:
        python_version = subprocess.check_output([sys.executable, "--version"], text=True).strip()
        print(f"✅ {python_version}")
    except:
        print("❌ Python not found!")
        return
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True).strip()
        print(f"✅ Node.js {node_version}")
    except:
        print("❌ Node.js not found! Please install Node.js 16+")
        return
    
    # Check npm
    try:
        npm_version = subprocess.check_output(["npm", "--version"], text=True).strip()
        print(f"✅ npm {npm_version}")
    except:
        print("❌ npm not found!")
        return
    
    # Setup backend
    if not setup_backend():
        print("\n❌ Backend setup failed!")
        return
    
    # Setup frontend
    if not setup_frontend():
        print("\n❌ Frontend setup failed!")
        return
    
    # Success message
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📝 Next steps:")
    print("1. Start the backend server:")
    if os.name == 'nt':
        print("   cd backend && venv\\Scripts\\activate && uvicorn main:app --reload")
    else:
        print("   cd backend && source venv/bin/activate && uvicorn main:app --reload")
    
    print("\n2. In a new terminal, start the frontend:")
    print("   cd frontend && npm start")
    
    print("\n3. Access the application:")
    print("   Frontend: http://localhost:3000")
    print("   Backend API: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    print("\n🔑 Default login credentials:")
    print("   Admin: admin / admin123")
    print("   Professor: prof_smith / prof123")
    print("   Student: student_john / student123")

if __name__ == "__main__":
    main()