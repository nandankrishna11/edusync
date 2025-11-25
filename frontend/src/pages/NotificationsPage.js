/**
 * Notifications Page
 * Role-based notification management and viewing
 */
import React from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import AdminNotificationManager from '../components/AdminNotificationManager';
import ProfessorNotificationManager from '../components/ProfessorNotificationManager';
import StudentNotificationViewer from '../components/StudentNotificationViewer';

const NotificationsPage = () => {
  const { user, isAdmin, isProfessor, isStudent } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin() && <AdminNotificationManager />}
      {isProfessor() && <ProfessorNotificationManager />}
      {isStudent() && <StudentNotificationViewer />}
    </div>
  );
};

export default NotificationsPage;