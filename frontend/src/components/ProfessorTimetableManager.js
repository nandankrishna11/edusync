/**
 * Professor Timetable Management Component
 * View and manage professor's own timetable
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import api from '../api/client';

const ProfessorTimetableManager = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfessorTimetable();
  }, []);

  const fetchProfessorTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/timetable/professor/${user.user_id}`);
      setTimetable(response.data || []);
    } catch (error) {
      setError('Failed to fetch your timetable');
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async (entry) => {
    const reason = prompt('Please provide a reason for cancelling this class:');
    if (!reason) return;

    try {
      setLoading(true);
      setError('');
      
      const cancelData = {
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end,
        cancel_reason: reason
      };

      // Add appropriate identifier based on entry type
      if (entry.class_id) {
        cancelData.class_id = entry.class_id;
      } else {
        cancelData.department_code = entry.department_code;
        cancelData.semester = entry.semester;
        cancelData.section = entry.section;
      }

      await api.patch('/timetable/cancel', cancelData);
      setSuccess('Class cancelled successfully');
      fetchProfessorTimetable();
    } catch (error) {
      setError('Failed to cancel class: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClass = async (entry) => {
    try {
      setLoading(true);
      setError('');
      
      const restoreData = {
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end
      };

      // Add appropriate identifier based on entry type
      if (entry.class_id) {
        restoreData.class_id = entry.class_id;
      } else {
        restoreData.department_code = entry.department_code;
        restoreData.semester = entry.semester;
        restoreData.section = entry.section;
      }

      await api.patch('/timetable/undo_cancel', restoreData);
      setSuccess('Class restored successfully');
      fetchProfessorTimetable();
    } catch (error) {
      setError('Failed to restore class: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Group timetable by day
  const groupedTimetable = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Timetable</h1>
            <p className="text-green-100">View and manage your class schedule</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{timetable.length}</div>
            <div className="text-green-100">Total Classes</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Timetable */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : timetable.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
          <p className="text-gray-500">You don't have any classes assigned to you yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(day => {
            const dayClasses = groupedTimetable[day] || [];
            if (dayClasses.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{day}</h2>
                  <p className="text-gray-600">{dayClasses.length} classes</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayClasses
                      .sort((a, b) => a.period_start.localeCompare(b.period_start))
                      .map((entry, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            entry.is_cancelled
                              ? 'border-red-200 bg-red-50'
                              : 'border-green-200 bg-green-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900">
                              {entry.subject_code || entry.subject || 'Unknown Subject'}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.is_cancelled
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.is_cancelled ? 'Cancelled' : 'Active'}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            {entry.period_start} - {entry.period_end}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            {entry.class_id || `${entry.department_code} ${entry.semester}${entry.section}`}
                          </div>

                          {entry.is_cancelled && entry.cancel_reason && (
                            <div className="text-xs text-red-600 mb-3">
                              Reason: {entry.cancel_reason}
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {entry.is_cancelled ? (
                              <button
                                onClick={() => handleRestoreClass(entry)}
                                disabled={loading}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCancelClass(entry)}
                                disabled={loading}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfessorTimetableManager;