#!/usr/bin/env python3
"""
Test registration functionality
"""
import requests
import json

def test_registration():
    """Test user registration"""
    url = "http://localhost:8000/api/auth/register"
    
    test_user = {
        "username": "testuser_frontend",
        "email": "testfrontend@example.com", 
        "password": "testpass123",
        "full_name": "Test Frontend User",
        "role": "student"
    }
    
    try:
        print("Testing registration...")
        response = requests.post(url, json=test_user, timeout=10)
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Registration successful!")
            print(f"   User ID: {user_data['id']}")
            print(f"   Username: {user_data['username']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Role: {user_data['role']}")
            return True
        else:
            print(f"❌ Registration failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error during registration: {e}")
        return False

def test_login():
    """Test user login"""
    url = "http://localhost:8000/api/auth/token"
    
    login_data = {
        "username": "testuser_frontend",
        "password": "testpass123"
    }
    
    try:
        print("\nTesting login...")
        response = requests.post(
            url, 
            data=login_data,  # Form data for OAuth2
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful!")
            print(f"   Token type: {token_data['token_type']}")
            print(f"   User: {token_data['user']['username']}")
            print(f"   Role: {token_data['user']['role']}")
            return True
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return False

def main():
    print("🧪 Testing Registration & Login Functionality")
    print("=" * 50)
    
    registration_ok = test_registration()
    login_ok = test_login()
    
    print("\n" + "=" * 50)
    if registration_ok and login_ok:
        print("🎉 All authentication tests passed!")
        print("\n✅ Registration is working correctly")
        print("✅ Login is working correctly")
        print("\n📝 You can now:")
        print("1. Open http://localhost:3000")
        print("2. Click 'Create Account' to register")
        print("3. Login with your new account")
    else:
        print("⚠️ Some tests failed:")
        if not registration_ok:
            print("- Registration needs to be fixed")
        if not login_ok:
            print("- Login needs to be fixed")

if __name__ == "__main__":
    main()