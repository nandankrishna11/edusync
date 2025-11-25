"""
Simple password setter using bcrypt directly
"""

import sqlite3
import bcrypt

def set_simple_passwords():
    """Set simple test passwords for all users"""
    
    conn = sqlite3.connect('classroom_rag.db')
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT user_id, role FROM users")
    users = cursor.fetchall()
    
    test_password = "password123"
    # Hash the password
    hashed_password = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    print(f"Setting password '{test_password}' for all users...")
    
    for user_id, role in users:
        cursor.execute("""
            UPDATE users 
            SET hashed_password = ?
            WHERE user_id = ?
        """, (hashed_password, user_id))
        print(f"✅ Updated password for {user_id} ({role})")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 All users now have password: {test_password}")

if __name__ == "__main__":
    set_simple_passwords()