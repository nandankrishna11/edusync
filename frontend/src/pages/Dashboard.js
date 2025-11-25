import React from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import StudentDashboard from '../components/StudentDashboard';
import ProfessorDashboard from '../components/ProfessorDashboard';
import AdminPanel from '../components/AdminPanel/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  if (user.role === 'student') {
    return <StudentDashboard />;
  }

  if (user.role === 'professor') {
    return <ProfessorDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Invalid user role</div>
    </div>
  );
};

export default Dashboard;