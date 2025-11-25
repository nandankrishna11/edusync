from database import SessionLocal
from models.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

user = db.query(User).filter(User.user_id=='4KV22CS090').first()
if user:
    print(f'User: {user.user_id}')
    print(f'Has password: {bool(user.hashed_password)}')
    
    # Test common passwords
    for pwd in ['password123', 'student123', 'Password123', '123456']:
        if user.hashed_password:
            result = pwd_context.verify(pwd, user.hashed_password)
            print(f'Test "{pwd}": {result}')

db.close()
