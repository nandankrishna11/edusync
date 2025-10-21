/**
 * Timetable Page - Main timetable view for students and professors
 */
import React, { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import TimetableGrid from '../features/timetable/components/TimetableGrid';
import TimetableManagement from '../features/timetable/components/TimetableManagement';

const TimetablePage = () => {
  const { user, isProfessor, isAdmin, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('view');
  const [selectedClass, setSelectedClass] = useState('1MS21CS');

  // Sample class options - in production, this would come from an API
  const classOptions = [
    '1MS21CS', '2MS21CS', '3MS21CS', '4MS21CS',
    '1MS21IS', '2MS21IS', '3MS21IS', '4MS21IS',
    '1MS21EC', '2MS21EC', '3MS21EC', '4MS21EC'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Timetable</h1>
          <p className="mt-2 text-gray-600">
            {isStudent() && 'View your class schedule and check for any cancelled classes'}
            {isProfessor() && 'Manage your classes and view schedules'}
            {isAdmin() && 'Manage all timetables and class schedules'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Timetable
            </button>
            
            {(isProfessor() || isAdmin()) && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Classes
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'view' && (
          <div>
            {/* Class Selector for Students and Admins */}
            {(isStudent() || isAdmin()) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="form-input max-w-xs"
                >
                  {classOptions.map(classId => (
                    <option key={classId} value={classId}>{classId}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Timetable Grid */}
            <TimetableGrid 
              classId={isProfessor() && !isAdmin() ? user.class_id || selectedClass : selectedClass} 
            />
          </div>
        )}

        {activeTab === 'manage' && (isProfessor() || isAdmin()) && (
          <TimetableManagement />
        )}

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Classes</h3>
                <p className="text-sm text-gray-500">Classes running as scheduled</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Cancelled Classes</h3>
                <p className="text-sm text-gray-500">Classes cancelled by professor</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Quick Info</h3>
                <p className="text-sm text-gray-500">
                  {isStudent() && 'Check for class updates regularly'}
                  {isProfessor() && 'Click on classes to cancel or restore'}
                  {isAdmin() && 'Manage all class schedules'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;