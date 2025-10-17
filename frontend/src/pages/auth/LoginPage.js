/**
 * Login Page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginForm } from '../../features/auth/components';

const LoginPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      const roleRoutes = {
        admin: '/admin/dashboard',
        professor: '/professor/dashboard',
        student: '/student/dashboard'
      };
      navigate(roleRoutes[user.role] || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return <LoginForm />;
};

export default LoginPage;