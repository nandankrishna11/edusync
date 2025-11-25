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
import TextbookLibraryPage from '../pages/textbooks/TextbookLibraryPage';
import TextbookSearchPage from '../pages/textbooks/TextbookSearchPage';
import SearchResultsPage from '../pages/textbooks/SearchResultsPage';
import MySubjectsPage from '../pages/textbooks/MySubjectsPage';
import ChatPage from '../pages/textbooks/ChatPage';
import MarksEntryPage from '../features/marks/pages/MarksEntryPage';
import MarksViewPage from '../features/marks/pages/MarksViewPage';
import StudentPerformancePage from '../features/marks/pages/StudentPerformancePage';
import StudentMarksPage from '../features/marks/pages/StudentMarksPage';
import NotFoundPage from '../pages/NotFoundPage';
import AboutPage from '../pages/AboutPage';

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
            <Route path="marks" element={<StudentMarksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="textbooks/search" element={<TextbookSearchPage />} />
            <Route path="textbooks/results" element={<SearchResultsPage />} />
            <Route path="textbooks/my-subjects" element={<MySubjectsPage />} />
            <Route path="textbooks/chat" element={<ChatPage />} />
            <Route path="textbooks/chat/:sessionId" element={<ChatPage />} />
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
            <Route path="marks" element={<MarksViewPage />} />
            <Route path="marks/entry" element={<MarksEntryPage />} />
            <Route path="marks/performance" element={<StudentPerformancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="textbooks/library" element={<TextbookLibraryPage />} />
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
            <Route path="marks" element={<MarksViewPage />} />
            <Route path="marks/entry" element={<MarksEntryPage />} />
            <Route path="marks/performance" element={<StudentPerformancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="textbooks/library" element={<TextbookLibraryPage />} />
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
      
      {/* About Page */}
      <Route path="/about" element={<AboutPage />} />
      
      {/* 404 Page */}
      <Route path="/404" element={<NotFoundPage />} />
      
      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default RoleBasedRouter;