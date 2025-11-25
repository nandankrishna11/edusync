/**
 * Department-Semester Timetable Page
 * Dedicated page for viewing department-semester specific timetables
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { timetableService } from '../features/timetable/services/timetableService';

const DepartmentTimetablePage = () => {
  const { department, semester, section } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isProfessor } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
    { start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
  ];

  const departmentNames = {
    CS: 'Computer Science',
    ME: 'Mechanical Engineering',
    EC: 'Electronics & Communication',
    CV: 'Civil Engineering',
    EE: 'Electrical Engineering',
    IT: 'Information Technology',
  };

  useEffect(() => {
    if (department && semester) {
      fetchTimetable();
    }
  }, [department, semester, section]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await timetableService.getSemesterTimetable(
        department,
        parseInt(semester),
        section || 'A'
      );
      setTimetable(data);
    } catch (error) {
      setError('Failed to fetch timetable');
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimetableGrid = () => {
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period.start] = null;
      });
    });

    timetable.forEach(entry => {
      if (grid[entry.day] && grid[entry.day].hasOwnProperty(entry.period_start)) {
        grid[entry.day][entry.period_start] = entry;
      }
    });

    return grid;
  };

  const handleCancelClass = async (entry) => {
    if (!isProfessor() && !isAdmin()) return;
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await timetableService.cancelClass({
        department_code: entry.department_code,
        semester: entry.semester,
        section: entry.section,
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end,
        cancel_reason: reason
      });
      fetchTimetable();
    } catch (error) {
      alert('Failed to cancel class');
    }
  };

  const handleRestoreClass = async (entry) => {
    if (!isProfessor() && !isAdmin()) return;

    try {
      await timetableService.restoreClass({
        department_code: entry.department_code,
        semester: entry.semester,
        section: entry.section,
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end
      });
      fetchTimetable();
    } catch (error) {
      alert('Failed to restore class');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const grid = generateTimetableGrid();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/timetable')}
              className="flex items-center text-indigo-100 hover:text-white mb-2 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Overview
            </button>
            <h1 className="text-3xl font-bold mb-2">
              {departmentNames[department] || department} - Semester {semester}
            </h1>
            <p className="text-indigo-100">
              Section {section || 'A'} • {timetable.filter(t => !t.is_cancelled).length} Active Classes • {timetable.filter(t => t.is_cancelled).length} Cancelled
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">
              {department === 'CS' && '💻'}
              {department === 'ME' && '⚙️'}
              {department === 'EC' && '📡'}
              {department === 'CV' && '🏗️'}
              {department === 'EE' && '⚡'}
              {department === 'IT' && '🌐'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700 sticky left-0 z-10">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="border border-gray-300 px-4 py-3 bg-gray-50 text-center text-sm font-medium text-gray-700 min-w-[200px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.start}>
                  <td className="border border-gray-300 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap sticky left-0 z-10">
                    {period.label}
                  </td>
                  {days.map(day => {
                    const entry = grid[day][period.start];
                    return (
                      <td key={day} className="border border-gray-300 p-2 h-24 align-top">
                        {entry ? (
                          <div className={`p-3 rounded-lg text-sm h-full relative ${
                            entry.is_cancelled 
                              ? 'bg-red-100 border-l-4 border-red-400' 
                              : 'bg-blue-100 border-l-4 border-blue-400'
                          }`}>
                            <div className="font-semibold text-gray-900 mb-1">
                              {entry.subject_code}
                            </div>
                            <div className="text-gray-600 text-xs mb-1">
                              Prof: {entry.professor_usn}
                            </div>
                            {entry.is_cancelled && (
                              <div className="text-red-600 text-xs mb-2">
                                Cancelled: {entry.cancel_reason}
                              </div>
                            )}
                            
                            {/* Action buttons for professors/admins */}
                            {(isProfessor() || isAdmin()) && (
                              <div className="absolute bottom-1 right-1 flex space-x-1">
                                {entry.is_cancelled ? (
                                  <button
                                    onClick={() => handleRestoreClass(entry)}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    title="Restore Class"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCancelClass(entry)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Cancel Class"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            <span className="text-xs">Free Period</span>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {timetable.length}
          </div>
          <div className="text-sm text-gray-600">Total Classes</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {timetable.filter(t => !t.is_cancelled).length}
          </div>
          <div className="text-sm text-gray-600">Active Classes</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {timetable.filter(t => t.is_cancelled).length}
          </div>
          <div className="text-sm text-gray-600">Cancelled Classes</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {new Set(timetable.map(t => t.professor_usn)).size}
          </div>
          <div className="text-sm text-gray-600">Professors</div>
        </div>
      </div>

      {/* Class List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Schedule Details</h3>
        <div className="space-y-3">
          {timetable.map((entry, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              entry.is_cancelled ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{entry.subject_code}</h4>
                  <p className="text-sm text-gray-600">
                    {entry.day}, {entry.period_start} - {entry.period_end}
                  </p>
                  <p className="text-sm text-gray-600">Professor: {entry.professor_usn}</p>
                  {entry.is_cancelled && (
                    <p className="text-sm text-red-600 mt-1">
                      Cancelled: {entry.cancel_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    entry.is_cancelled 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {entry.is_cancelled ? 'Cancelled' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {timetable.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
              <p className="text-gray-500">This department-semester combination has no timetable entries yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentTimetablePage;