# Authentication Module

This module provides complete authentication and authorization functionality for the Classroom Management System.

## Features

- **User Registration & Login**: JWT-based authentication
- **Role-Based Access Control (RBAC)**: Support for admin, professor, and student roles
- **Permission System**: Fine-grained permissions for different operations
- **User Management**: CRUD operations for user accounts
- **Password Management**: Secure password hashing and change functionality

## User Roles

### Admin
- Full system access (all permissions)
- User management capabilities
- System configuration

### Professor
- Class and timetable management
- Attendance tracking
- Student analytics
- Notification management

### Student
- View classes and timetables
- Check attendance records
- Receive notifications
- Update profile

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login and get access token
- `POST /api/auth/verify-token` - Verify token validity
- `GET /api/auth/me` - Get current user info

### User Management
- `GET /api/auth/users` - List all users (admin only)
- `GET /api/auth/users/{id}` - Get user by ID
- `PUT /api/auth/users/{id}` - Update user
- `DELETE /api/auth/users/{id}` - Delete user (admin only)
- `POST /api/auth/change-password` - Change password

### Utilities
- `GET /api/auth/roles` - Get available roles

## Usage

### Initialize Auth System
```bash
cd backend
python init_auth.py
```

### Default Credentials
- **Admin**: admin / admin123
- **Professor**: prof_smith / prof123  
- **Student**: student_john / student123

### Using Dependencies
```python
from modules.auth.dependencies import require_admin, require_permission

@router.get("/admin-only")
async def admin_endpoint(current_user = Depends(require_admin)):
    return {"message": "Admin access granted"}

@router.get("/protected")
async def protected_endpoint(
    current_user = Depends(require_permission("read_classes"))
):
    return {"message": "Permission granted"}
```

## Security Features

- Bcrypt password hashing
- JWT token-based authentication
- Role and permission validation
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy ORM