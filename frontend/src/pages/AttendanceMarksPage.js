/**
 * Integrated Attendance and Marks Page
 * Role-based interface for attendance and marks management
 */
import React from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import ProfessorAttendanceManager from '../components/ProfessorAttendanceManager';
import ProfessorMarksManager from '../components/ProfessorMarksManager';
import StudentAttendanceView from '../components/StudentAttendanceView';
import StudentMarksView from '../components/StudentMarksView';

const AttendanceMarksPage = () => {
  const { user, isAdmin, isProfessor, isStudent } = useAuth();
  const [activeTab, setActiveTab] = React.useState('attendance');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Admin sees both professor interfaces
  if (isAdmin()) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Attendance Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'marks'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Marks Management
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' ? <ProfessorAttendanceManager /> : <ProfessorMarksManager />}
      </div>
    );
  }

  // Professor sees both attendance and marks management
  if (isProfessor()) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Mark Attendance
                </div>
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'marks'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload Marks
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' ? <ProfessorAttendanceManager /> : <ProfessorMarksManager />}
      </div>
    );
  }

  // Student sees both attendance and marks views
  if (isStudent()) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  My Attendance
                </div>
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'marks'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Marks & Grades
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' ? <StudentAttendanceView /> : <StudentMarksView />}
      </div>
    );
  }

  // Fallback for unknown roles
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          You don't have permission to view attendance and marks.
        </p>
        <p className="text-sm text-gray-500">
          Current role: {user.role}
        </p>
      </div>
    </div>
  );
};

export default AttendanceMarksPage;