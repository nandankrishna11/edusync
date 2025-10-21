/**
 * Role-Based Router Component
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

// Import pages
import Dashboard from '../pages/Dashboard';
import TimetablePage from '../pages/TimetablePage';
import AttendancePage from '../pages/AttendancePage';
import NotificationsPage from '../pages/NotificationsPage';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import { UserProfile, UserManagement } from '../features/auth/components';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

const RoleBasedRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  const getDashboardRoute = () => {
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'professor':
        return '/professor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
      
      {/* Student Routes */}
      <Route path="/student/*" element={
        <ProtectedRoute requiredRole="student">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      {/* Professor Routes */}
      <Route path="/professor/*" element={
        <ProtectedRoute requiredRole="professor">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="*" element={<Navigate to="/professor/dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="admin">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/reports" element={<AttendancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/dashboard" element={<Navigate to={getDashboardRoute()} replace />} />
      <Route path="/timetable" element={<Navigate to={`/${user.role}/timetable`} replace />} />
      <Route path="/attendance" element={<Navigate to={`/${user.role}/attendance`} replace />} />
      <Route path="/notifications" element={<Navigate to={`/${user.role}/notifications`} replace />} />
      <Route path="/analytics" element={
        <ProtectedRoute requiredRole={["professor", "admin"]}>
          <Navigate to={`/${user.role}/analytics`} replace />
        </ProtectedRoute>
      } />
      
      {/* Profile Routes */}
      <Route path="/profile" element={<UserProfile />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to={getDashboardRoute()} replace />} />
    </Routes>
  );
};

export default RoleBasedRouter;