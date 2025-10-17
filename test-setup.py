#!/usr/bin/env python3
"""
Quick test to verify the setup is working
"""
import requests
import time
import sys

def test_backend():
    """Test if backend is running"""
    try:
        print("Testing backend connection...")
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible!")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_frontend():
    """Test if frontend is running"""
    try:
        print("Testing frontend connection...")
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running and accessible!")
            return True
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is not running or not accessible")
        return False
    except Exception as e:
        print("❌ Error testing frontend: {e}")
        return False

def main():
    print("🧪 Testing Classroom Management System Setup")
    print("=" * 50)
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    if backend_ok and frontend_ok:
        print("🎉 All tests passed! Your setup is working perfectly!")
        print("\n📝 Next steps:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Login with: admin / admin123")
        print("3. Explore the classroom management features!")
    else:
        print("⚠️ Some issues detected:")
        if not backend_ok:
            print("- Backend server needs to be started")
            print("  Run: start-backend.bat or python -m uvicorn main:app --reload")
        if not frontend_ok:
            print("- Frontend server needs to be started") 
            print("  Run: start-frontend.bat or npm start")
        
        print("\n💡 Try running start-all.bat to start both servers")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error: {e}")