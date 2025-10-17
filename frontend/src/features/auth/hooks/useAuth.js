/**
 * Authentication hook
 */
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid
          await authService.verifyToken();
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const updateProfile = async (userId, userData) => {
    const updatedUser = await authService.updateUser(userId, userData);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const changePassword = async (passwordData) => {
    return await authService.changePassword(passwordData);
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const rolePermissions = {
      student: [
        'read_classes', 'read_timetable', 'read_attendance', 
        'read_notifications', 'update_profile'
      ],
      professor: [
        'read_classes', 'create_classes', 'update_classes', 'delete_classes',
        'read_timetable', 'create_timetable', 'update_timetable', 'delete_timetable',
        'read_attendance', 'create_attendance', 'update_attendance',
        'read_notifications', 'create_notifications', 'update_notifications', 'delete_notifications',
        'read_analytics', 'read_students', 'update_profile'
      ],
      admin: ['*'] // All permissions
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const isAdmin = () => hasRole('admin');
  const isProfessor = () => hasRole('professor');
  const isStudent = () => hasRole('student');

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    isAdmin,
    isProfessor,
    isStudent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};