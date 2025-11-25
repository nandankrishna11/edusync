#!/usr/bin/env python3
"""
Server Startup Script
Handles common startup issues and runs the server
"""
import sys
import os
import subprocess
from pathlib import Path

def check_and_install_dependencies():
    """Check and install required dependencies"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn[standard]",
        "sqlalchemy",
        "pydantic",
        "python-multipart",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "sqlite3"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == "sqlite3":
                import sqlite3
            else:
                __import__(package.split('[')[0])  # Handle packages with extras like uvicorn[standard]
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - missing")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    return True

def setup_database():
    """Set up database if needed"""
    print("\n🗄️  Setting up database...")
    
    # Check if database exists
    db_files = ["classroom_rag.db", "database.db", "app.db"]
    db_exists = any(Path(f).exists() for f in db_files)
    
    if not db_exists:
        print("⚠️  No database found. Running setup...")
        try:
            # Run migrations
            if Path("migrate_timetable.py").exists():
                print("Running timetable migration...")
                subprocess.check_call([sys.executable, "migrate_timetable.py"])
            
            if Path("migrate_user_specialization.py").exists():
                print("Running user specialization migration...")
                subprocess.check_call([sys.executable, "migrate_user_specialization.py"])
            
            # Set up demo data
            if Path("setup_timetable_demo.py").exists():
                print("Setting up demo data...")
                subprocess.check_call([sys.executable, "setup_timetable_demo.py"])
            
            print("✅ Database setup completed")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Database setup had issues: {e}")
            print("   The server will try to create basic tables automatically")
    else:
        print("✅ Database found")

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting server...")
    
    try:
        # Try to start with uvicorn
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        print("Server will be available at: http://localhost:8000")
        print("API documentation at: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 50)
        
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except FileNotFoundError:
        print("❌ uvicorn not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn[standard]"])
        print("✅ uvicorn installed. Please run the script again.")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("\nTry running manually:")
        print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")

def main():
    """Main startup function"""
    print("🚀 FastAPI Server Startup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("main.py").exists():
        print("❌ main.py not found.")
        print("Make sure you're in the backend directory:")
        print("   cd backend")
        print("   python start_server.py")
        return
    
    print("✅ Found main.py")
    
    # Check and install dependencies
    if not check_and_install_dependencies():
        print("❌ Failed to set up dependencies")
        return
    
    # Set up database
    setup_database()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()