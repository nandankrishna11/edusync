/**
 * Unified Timetable Page
 * Shows appropriate timetable view based on user role
 */
import { useAuth } from '../features/auth/hooks/useAuth';
import EnhancedAdminTimetableManager from '../components/EnhancedAdminTimetableManager';
import ProfessorTimetableView from '../features/timetable/components/ProfessorTimetableView';
import EnhancedStudentTimetableView from '../components/EnhancedStudentTimetableView';

const TimetablePage = () => {
  const { user, isAdmin, isProfessor, isStudent } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Admin sees timetable management interface
  if (isAdmin()) {
    return <EnhancedAdminTimetableManager />;
  }

  // Professor sees their timetable with cancel/restore options
  if (isProfessor()) {
    return <ProfessorTimetableView />;
  }

  // Student sees class timetable with status
  if (isStudent()) {
    return <EnhancedStudentTimetableView />;
  }

  // Fallback for unknown roles
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          You don't have permission to view timetables.
        </p>
        <p className="text-sm text-gray-500">
          Current role: {user.role}
        </p>
      </div>
    </div>
  );
};

export default TimetablePage;