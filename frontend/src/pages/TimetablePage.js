import React, { useState, useEffect } from 'react';
import Timetable from '../components/Timetable';
import { getNextClass } from '../services/api';

const TimetablePage = () => {
  const [userRole, setUserRole] = useState('student'); // 'student' or 'professor'
  const [selectedClassId, setSelectedClassId] = useState('CS301');
  const [nextClass, setNextClass] = useState(null);
  const [showCancelledBanner, setShowCancelledBanner] = useState(false);

  const availableClasses = [
    { id: 'CS301', name: 'Computer Science 301' },
    { id: 'MATH201', name: 'Mathematics 201' },
    { id: 'PHYS101', name: 'Physics 101' }
  ];

  useEffect(() => {
    checkNextClass();
  }, [selectedClassId]);

  const checkNextClass = async () => {
    try {
      const nextClassData = await getNextClass(selectedClassId);
      setNextClass(nextClassData);
      
      // Show banner if next class is cancelled
      if (nextClassData.has_next_class && nextClassData.next_class.is_cancelled) {
        setShowCancelledBanner(true);
      } else {
        setShowCancelledBanner(false);
      }
    } catch (error) {
      console.error('Error fetching next class:', error);
    }
  };

  return (
    <div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancelled Class Banner */}
        {showCancelledBanner && nextClass?.next_class && (
          <div className="bg-app-danger bg-opacity-10 border border-app-danger rounded-app p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-app-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-app-danger">
                  Next Class Cancelled
                </h3>
                <div className="mt-1 text-sm text-app-danger">
                  <p>
                    <strong>{nextClass.next_class.subject}</strong> on {nextClass.next_class.day} at {nextClass.next_class.period_start}-{nextClass.next_class.period_end} has been cancelled.
                  </p>
                  {nextClass.next_class.cancel_reason && (
                    <p className="mt-1">
                      <strong>Reason:</strong> {nextClass.next_class.cancel_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-3">
                <button
                  onClick={() => setShowCancelledBanner(false)}
                  className="text-app-danger hover:text-app-danger opacity-75 hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-app-text-primary mb-2">
                Class Timetable
              </h1>
              <p className="text-app-text-secondary text-lg">
                View and manage your class schedule
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Role Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-app-text-primary">View as:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="px-3 py-2 border border-app-border rounded-app text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>

              {/* Class Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-app-text-primary">Class:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-2 border border-app-border rounded-app text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                >
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Next Class Info */}
        {nextClass?.has_next_class && !nextClass.next_class.is_cancelled && (
          <div className="bg-app-success bg-opacity-10 border border-app-success rounded-app p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-app-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-app-success">
                  Next Class
                </h3>
                <p className="mt-1 text-sm text-app-success">
                  <strong>{nextClass.next_class.subject}</strong> on {nextClass.next_class.day} at {nextClass.next_class.period_start}-{nextClass.next_class.period_end}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Component */}
        <Timetable 
          userRole={userRole} 
          selectedClassId={selectedClassId}
        />

        {/* Legend */}
        <div className="mt-8 bg-app-card rounded-app p-6 shadow-app-card">
          <h3 className="text-lg font-semibold text-app-text-primary mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-app-success rounded-full"></div>
              <span className="text-sm text-app-text-secondary">Active Class</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-app-danger rounded-full"></div>
              <span className="text-sm text-app-text-secondary">Cancelled Class</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-app-primary rounded-full"></div>
              <span className="text-sm text-app-text-secondary">Live Updates Active</span>
            </div>
          </div>
          
          {userRole === 'professor' && (
            <div className="mt-4 p-4 bg-app-bg rounded-app">
              <h4 className="font-medium text-app-text-primary mb-2">Professor Actions:</h4>
              <ul className="text-sm text-app-text-secondary space-y-1">
                <li>• Click "❌ Cancel" to cancel a class (requires reason)</li>
                <li>• Click "↩️ Restore" to restore a cancelled class</li>
                <li>• Changes are reflected in real-time for all students</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;