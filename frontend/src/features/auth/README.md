# Frontend Authentication Module

This module provides complete frontend authentication functionality for the Classroom Management System.

## Features

- **Login/Register Forms**: Modern, responsive authentication forms
- **Role-Based Access Control**: Automatic routing based on user roles
- **User Profile Management**: Profile editing and password change
- **User Management**: Admin interface for managing users
- **Protected Routes**: Route protection based on roles and permissions
- **Token Management**: Automatic token handling and refresh

## Components

### Authentication Forms
- `LoginForm` - User login with validation
- `RegisterForm` - User registration with role selection
- `LogoutButton` - Logout functionality

### User Management
- `UserProfile` - Profile editing and password change
- `UserManagement` - Admin interface for user CRUD operations

### Route Protection
- `ProtectedRoute` - Component-level route protection
- `RoleBasedRouter` - Role-based routing system

## Hooks

### useAuth
Main authentication hook providing:
- `user` - Current user object
- `isAuthenticated` - Authentication status
- `loading` - Loading state
- `login(credentials)` - Login function
- `logout()` - Logout function
- `register(userData)` - Registration function
- `hasRole(role)` - Role checking
- `hasPermission(permission)` - Permission checking
- `isAdmin()`, `isProfessor()`, `isStudent()` - Role helpers

## Services

### authService
API service for authentication:
- `login(credentials)` - User login
- `register(userData)` - User registration
- `getCurrentUser()` - Get current user
- `verifyToken()` - Verify JWT token
- `changePassword(data)` - Change password
- `getUsers()` - Get all users (admin)
- `updateUser(id, data)` - Update user (admin)
- `deleteUser(id)` - Delete user (admin)

## Usage

### Setup AuthProvider
```jsx
import { AuthProvider } from './features/auth/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### Using Authentication
```jsx
import { useAuth } from './features/auth/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome {user.full_name}</h1>
      {hasRole('admin') && <AdminPanel />}
    </div>
  );
}
```

### Protected Routes
```jsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Route path="/admin/*" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

## Role-Based Features

### Student
- View dashboard, timetable, attendance
- Update profile
- Receive notifications

### Professor  
- All student features
- Manage classes and timetables
- Mark attendance
- Send notifications
- View analytics

### Admin
- All professor features
- User management
- System administration

## Security Features

- JWT token-based authentication
- Automatic token refresh
- Route-level protection
- Role and permission validation
- Secure logout with token cleanup