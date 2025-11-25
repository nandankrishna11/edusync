/**
 * Student Timetable View Component
 * Shows class schedule with status indicators
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { timetableService } from '../services/timetableService';

const StudentTimetableView = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user) {
      fetchClassTimetable();
    }
  }, [user]);

  const fetchClassTimetable = async () => {
    try {
      setLoading(true);
      let data;
      
      // Extract semester from user specialization or other fields
      const extractSemesterInfo = () => {
        // Try to get semester from specialization field (e.g., "Semester 5")
        if (user.specialization && user.specialization.includes('Semester')) {
          const semesterMatch = user.specialization.match(/Semester (\d+)/);
          if (semesterMatch) {
            return parseInt(semesterMatch[1]);
          }
        }
        
        // Try to get from semester field directly
        if (user.semester) {
          return user.semester;
        }
        
        // Default fallback
        return 5;
      };
      
      const semester = extractSemesterInfo();
      
      // Check if user has department info for semester-based system
      if (user.department_code) {
        // New semester-based system
        console.log(`Fetching timetable for ${user.department_code} Semester ${semester} Section A`);
        data = await timetableService.getSemesterStatus(
          user.department_code, 
          semester, 
          'A'  // Default to section A
        );
      } else if (user.class_id) {
        // Legacy class-based system
        data = await timetableService.getClassStatus(user.class_id);
      } else {
        throw new Error('No class or semester information available');
      }
      
      setTimetable(data);
    } catch (error) {
      setError('Failed to fetch class timetable');
      console.error('Error fetching class timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassesByDay = (day) => {
    return timetable
      .filter(entry => entry.day === day)
      .sort((a, b) => a.period_start.localeCompare(b.period_start));
  };

  const getStatusColor = (entry) => {
    switch (entry.color_code) {
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (entry) => {
    if (entry.is_cancelled) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  const getCurrentDayClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return getClassesByDay(today);
  };

  const getUpcomingClass = () => {
    const todayClasses = getCurrentDayClasses();
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return todayClasses.find(cls => 
      cls.period_start > currentTime && !cls.is_cancelled
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const upcomingClass = getUpcomingClass();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Quick Status Card */}
      <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Class Schedule</h2>
            <p className="text-indigo-100">
              {user?.class_id ? `Class: ${user.class_id}` : 
               `${user?.department_code} - ${user?.specialization || 'Semester Info'} (Section A)`}
            </p>
          </div>
          <div className="text-right">
            {upcomingClass ? (
              <div>
                <p className="text-sm text-indigo-100">Next Class</p>
                <p className="text-lg font-semibold">{upcomingClass.subject}</p>
                <p className="text-sm text-indigo-100">{upcomingClass.period_start} - {upcomingClass.period_end}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-indigo-100">No more classes today</p>
                <p className="text-lg font-semibold">Enjoy your day!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Timetable</h1>
              <p className="text-gray-600">Your class schedule and updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Day Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDay('')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedDay === '' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Days
            </button>
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedDay === day 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[180px]">
                      <div className="flex items-center justify-center">
                        {day}
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day && (
                          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
                  { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
                  { start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
                  { start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
                  { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
                  { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
                ].map(period => (
                  <tr key={period.start} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap">
                      {period.label}
                    </td>
                    {days.map(day => {
                      const classEntry = timetable.find(entry => 
                        entry.day === day && 
                        entry.period_start === period.start && 
                        entry.period_end === period.end
                      );
                      
                      return (
                        <td key={day} className="border border-gray-300 p-2 h-20 align-top">
                          {classEntry ? (
                            <div className={`p-3 rounded-lg h-full ${
                              classEntry.is_cancelled 
                                ? 'bg-red-100 border-l-4 border-red-400' 
                                : 'bg-green-100 border-l-4 border-green-400'
                            }`}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                  <div className="font-semibold text-sm text-gray-900 truncate">
                                    {classEntry.subject || classEntry.subject_code}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    Prof: {classEntry.professor_usn}
                                  </div>
                                </div>
                                <div className="ml-2">
                                  {getStatusIcon(classEntry)}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  classEntry.is_cancelled 
                                    ? 'bg-red-200 text-red-800' 
                                    : 'bg-green-200 text-green-800'
                                }`}>
                                  {classEntry.status}
                                </span>
                              </div>
                              
                              {classEntry.is_cancelled && classEntry.cancel_reason && (
                                <div className="mt-2 p-1 bg-white bg-opacity-50 rounded">
                                  <p className="text-xs text-gray-700 truncate" title={classEntry.cancel_reason}>
                                    {classEntry.cancel_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <svg className="w-6 h-6 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-xs">Free</p>
                              </div>
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
          
          {/* Mobile View - Card Layout for smaller screens */}
          <div className="md:hidden mt-6">
            <div className="space-y-4">
              {(selectedDay ? [selectedDay] : days).map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    {day}
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day && (
                      <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                        Today
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {getClassesByDay(day).length > 0 ? (
                      getClassesByDay(day).map((entry, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 ${getStatusColor(entry)}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(entry)}
                              <div>
                                <h4 className="font-medium">
                                  {entry.subject || entry.subject_code}
                                </h4>
                                <p className="text-sm opacity-75">Prof: {entry.professor_usn}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {entry.period_start} - {entry.period_end}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                entry.is_cancelled 
                                  ? 'bg-red-200 text-red-800' 
                                  : 'bg-green-200 text-green-800'
                              }`}>
                                {entry.status}
                              </span>
                            </div>
                          </div>
                          
                          {entry.is_cancelled && entry.cancel_reason && (
                            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                              <p className="text-xs font-medium">Cancellation Reason:</p>
                              <p className="text-xs opacity-75">{entry.cancel_reason}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">No classes scheduled</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {timetable.filter(entry => !entry.is_cancelled).length}
              </p>
              <p className="text-sm text-gray-600">Active Classes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {timetable.filter(entry => entry.is_cancelled).length}
              </p>
              <p className="text-sm text-gray-600">Cancelled Classes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {timetable.length}
              </p>
              <p className="text-sm text-gray-600">Total Classes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetableView;