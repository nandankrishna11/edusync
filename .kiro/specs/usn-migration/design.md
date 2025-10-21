# Design Document - USN-Based Authentication Migration

## Overview

This document outlines the technical design for migrating the EduSync Classroom Management System from email-based to USN-based authentication. The migration will be implemented in phases to ensure system stability and data integrity.

## Architecture

### Current Authentication Flow
```
User Input (email + password) → Backend Validation → JWT Token (username) → Session Management
```

### New Authentication Flow
```
User Input (USN + password) → Backend Validation → JWT Token (USN) → Session Management
```

## Components and Interfaces

### 1. Database Schema Changes

#### User Model Migration
```python
# Current Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# New Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String, unique=True, index=True, nullable=False)  # NEW PRIMARY IDENTIFIER
    username = Column(String, unique=True, index=True, nullable=True)  # OPTIONAL
    email = Column(String, unique=True, index=True, nullable=True)  # OPTIONAL
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### Related Model Updates
```python
# Attendance Model - Replace student_id with usn
class AttendanceModel(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, nullable=False, index=True)
    usn = Column(String, nullable=False, index=True)  # CHANGED FROM student_id
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)
    marked_by = Column(String, nullable=True)  # Professor USN
    # ... other fields

# Notification Model - Replace student_id with target_usn
class NotificationModel(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    target_usn = Column(String, nullable=True, index=True)  # CHANGED FROM student_id
    # ... other fields

# Timetable Model - Replace professor_id with professor_usn
class Timetable(Base):
    __tablename__ = "timetable"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, nullable=False, index=True)
    day = Column(String, nullable=False)
    period_start = Column(String, nullable=False)
    period_end = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    professor_usn = Column(String, nullable=False)  # CHANGED FROM professor_id
    # ... other fields
```

### 2. Authentication Service Updates

#### Login Service
```python
def authenticate_user(db: Session, usn: str, password: str):
    """Authenticate user by USN and password"""
    user = db.query(models.User).filter(models.User.usn == usn).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token with USN"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    # Include USN in token payload
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
```

#### Registration Service
```python
def create_user(db: Session, user: schemas.UserCreate):
    """Create user with USN as primary identifier"""
    # Check if USN already exists
    existing_user = db.query(models.User).filter(models.User.usn == user.usn).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="USN already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        usn=user.usn,
        email=user.email,  # Optional
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

### 3. API Route Updates

#### Authentication Routes
```python
@router.post("/token", response_model=schemas.LoginResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with USN and password"""
    # form_data.username will contain USN
    user = services.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect USN or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Include USN and role in JWT token
    access_token = services.create_access_token(
        data={"sub": user.usn, "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=schemas.User)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register new user with USN"""
    return services.create_user(db=db, user=user)
```

### 4. Schema Updates

#### Pydantic Schemas
```python
class UserBase(BaseModel):
    usn: str  # NEW REQUIRED FIELD
    email: Optional[EmailStr] = None  # NOW OPTIONAL
    full_name: Optional[str] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    usn: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    usn: Optional[str] = None  # CHANGED FROM username
    role: Optional[str] = None
```

### 5. Frontend Component Updates

#### Login Form
```javascript
const LoginForm = () => {
  const [formData, setFormData] = useState({
    usn: '',        // CHANGED FROM email
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send USN instead of email
      const response = await authService.login({
        username: formData.usn,  // OAuth2 expects 'username' field
        password: formData.password
      });
      // Handle successful login
    } catch (error) {
      setError('Invalid USN or password');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="usn"
        placeholder="Enter your USN"
        value={formData.usn}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};
```

#### Registration Form
```javascript
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    usn: '',           // NEW REQUIRED FIELD
    email: '',         // NOW OPTIONAL
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'student'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      // Handle successful registration
    } catch (error) {
      setError('Registration failed. USN may already exist.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="usn"
        placeholder="Enter your USN (e.g., 1MS21CS001)"
        value={formData.usn}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Enter your email (optional)"
        value={formData.email}
        onChange={handleChange}
      />
      {/* Other fields */}
    </form>
  );
};
```

## Data Models

### USN Format Standards
- **Student USN Format**: `{Year}{Branch}{Section}{Roll}` (e.g., "1MS21CS001")
- **Professor USN Format**: `PROF{Department}{ID}` (e.g., "PROFCS001")
- **Admin USN Format**: `ADMIN{ID}` (e.g., "ADMIN001")

### Migration Data Mapping
```python
# Sample migration data
MIGRATION_DATA = {
    "admin": "ADMIN001",
    "prof_smith": "PROFCS001", 
    "student_john": "1MS21CS001"
}
```

## Error Handling

### Authentication Errors
- **Invalid USN**: "USN not found"
- **Invalid Password**: "Invalid USN or password"
- **Duplicate USN**: "USN already registered"
- **Invalid USN Format**: "USN format is invalid"

### Validation Rules
- USN must be alphanumeric
- USN length: 6-15 characters
- USN must follow institutional format
- Password requirements remain unchanged

## Testing Strategy

### Unit Tests
- User model CRUD operations with USN
- Authentication service with USN
- Token generation and validation
- Password hashing and verification

### Integration Tests
- Login flow with USN credentials
- Registration with USN validation
- Cross-module USN references
- API endpoint functionality

### Migration Tests
- Data migration accuracy
- Backward compatibility
- Performance benchmarks
- Security validation

## Migration Plan

### Phase 1: Database Schema Update
1. Add USN column to User table
2. Create migration script for existing data
3. Update indexes and constraints

### Phase 2: Backend Service Updates
1. Update authentication services
2. Modify API routes and schemas
3. Update cross-module references

### Phase 3: Frontend Updates
1. Update login and registration forms
2. Modify API service calls
3. Update user session management

### Phase 4: Testing and Validation
1. Comprehensive testing
2. Performance validation
3. Security audit
4. User acceptance testing

### Phase 5: Deployment and Monitoring
1. Production deployment
2. Monitoring and logging
3. User training and documentation
4. Rollback plan if needed