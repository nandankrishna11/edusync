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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          // Set mock user for development
          setUser({
            id: 1,
            username: 'demo_user',
            email: 'demo@classroom.com',
            full_name: 'Demo User',
            role: 'student'
          });
        })
        .finally(() => setLoading(false));
    } else {
      // Set mock user for development when no token exists
      setUser({
        id: 1,
        username: 'demo_user',
        email: 'demo@classroom.com',
        full_name: 'Demo User',
        role: 'student'
      });
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.access_token);
    const userInfo = await authService.getCurrentUser();
    setUser(userInfo);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};