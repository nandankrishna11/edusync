import { useAuth } from '../features/auth/hooks/useAuth';
import StudentAttendanceView from '../components/StudentAttendanceView';
import ProfessorAttendanceManager from '../components/ProfessorAttendanceManager';
import AdminAttendanceReport from '../components/AdminAttendanceReport';

const AttendancePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please log in to view attendance.</p>
      </div>
    );
  }

  // Render role-specific attendance component
  switch (user.role) {
    case 'student':
      return <StudentAttendanceView />;
    case 'professor':
      return <ProfessorAttendanceManager />;
    case 'admin':
      return <AdminAttendanceReport />;
    default:
      return (
        <div className="p-6 text-center">
          <p className="text-red-600">Invalid user role. Please contact administrator.</p>
        </div>
      );
  }
};

export default AttendancePage;