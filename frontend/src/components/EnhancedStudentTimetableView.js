import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { timetableService } from '../features/timetable/services/timetableService';

const EnhancedStudentTimetableView = () => {
  const { user, isStudent } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timetableData, setTimetableData] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'upcoming'

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const periods = [
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
    { start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' }
  ];

  useEffect(() => {
    if (isStudent()) {
      fetchStudentTimetable();
      fetchUpcomingClasses();
    }
  }, []);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchStudentTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await timetableService.getStudentTimetable();
      setTimetableData(data);
    } catch (error) {
      setError('Failed to fetch your timetable: ' + (error.response?.data?.detail || error.message));
      console.error('Error fetching student timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      const data = await timetableService.getStudentUpcomingClasses(7);
      setUpcomingClasses(data);
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
    }
  };

  const generateTimetableGrid = () => {
    if (!timetableData?.daily_schedule) return {};
    
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period.start] = null;
      });
    });

    // Fill grid with timetable data
    Object.entries(timetableData.daily_schedule).forEach(([day, classes]) => {
      classes.forEach(classItem => {
        if (grid[day] && grid[day].hasOwnProperty(classItem.period_start)) {
          grid[day][classItem.period_start] = classItem;
        }
      });
    });

    return grid;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isStudent()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">This page is only accessible to students.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Timetable</h1>
            <p className="text-blue-100">View your class schedule and upcoming classes</p>
            {timetableData?.student_info && (
              <div className="mt-3 text-sm">
                <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full mr-2">
                  {timetableData.student_info.usn}
                </span>
                <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full mr-2">
                  {timetableData.student_info.department_name}
                </span>
                <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">
                  Semester {timetableData.student_info.current_semester}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {timetableData?.total_classes || 0}
            </div>
            <div className="text-blue-100 text-sm">Total Classes</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'upcoming' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming Classes
            </button>
          </div>
          
          <button
            onClick={() => {
              fetchStudentTimetable();
              fetchUpcomingClasses();
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timetable...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        !timetableData || Object.keys(timetableData.daily_schedule || {}).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Found</h3>
            <p className="text-gray-500">
              {timetableData?.message || "Your timetable is not available yet. Please contact your administrator."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
              <p className="text-gray-600">
                {timetableData.student_info.department_name} - Semester {timetableData.student_info.current_semester} - Section {timetableData.student_info.section}
              </p>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700">
                        Time
                      </th>
                      {days.map(day => (
                        <th key={day} className="border border-gray-300 px-4 py-3 bg-gray-50 text-center text-sm font-medium text-gray-700 min-w-[180px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period.start}>
                        <td className="border border-gray-300 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap">
                          {period.label}
                        </td>
                        {days.map(day => {
                          const grid = generateTimetableGrid();
                          const entry = grid[day]?.[period.start];
                          return (
                            <td key={day} className="border border-gray-300 p-2 h-24 align-top">
                              {entry ? (
                                <div className={`p-3 rounded-lg text-sm h-full ${
                                  entry.is_cancelled 
                                    ? 'bg-red-100 border-l-4 border-red-400' 
                                    : 'bg-green-100 border-l-4 border-green-400'
                                }`}>
                                  <div className="font-semibold text-gray-900 truncate">
                                    {entry.subject_code}
                                  </div>
                                  <div className="text-gray-600 truncate text-xs mt-1">
                                    {entry.subject_name}
                                  </div>
                                  <div className="text-gray-500 truncate text-xs mt-1">
                                    {entry.professor_name}
                                  </div>
                                  {entry.is_cancelled && (
                                    <div className="text-red-600 text-xs mt-1 font-medium">
                                      CANCELLED
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                  Free Period
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Upcoming Classes View */
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Classes</h2>
            <p className="text-gray-600">Next 7 days</p>
          </div>
          
          <div className="p-6">
            {!upcomingClasses || upcomingClasses.upcoming_classes?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Classes</h3>
                <p className="text-gray-500">You have no classes scheduled for the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.upcoming_classes.map((classItem, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(classItem.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {classItem.day}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 w-20 text-center mx-4">
                      <div className="text-sm font-medium text-indigo-600">
                        {classItem.period_start}
                      </div>
                      <div className="text-xs text-gray-500">
                        {classItem.period_end}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {classItem.subject_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {classItem.subject_code}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-gray-900">
                        {classItem.professor_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Professor
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStudentTimetableView;