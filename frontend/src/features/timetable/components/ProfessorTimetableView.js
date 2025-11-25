/**
 * Professor Timetable View Component
 * Shows professor's classes with ability to cancel/restore
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { timetableService } from '../services/timetableService';

const ProfessorTimetableView = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user?.user_id) {
      fetchProfessorTimetable();
    }
  }, [user]);

  const fetchProfessorTimetable = async () => {
    try {
      setLoading(true);
      const data = await timetableService.getProfessorTimetable(user.user_id);
      setTimetable(data);
    } catch (error) {
      setError('Failed to fetch your timetable');
      console.error('Error fetching professor timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async () => {
    if (!selectedClass || !cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      const cancelData = {
        day: selectedClass.day,
        period_start: selectedClass.period_start,
        period_end: selectedClass.period_end,
        cancel_reason: cancelReason
      };

      // Add appropriate identifier based on system
      if (selectedClass.class_id) {
        cancelData.class_id = selectedClass.class_id;
      } else if (selectedClass.department_code && selectedClass.semester) {
        cancelData.department_code = selectedClass.department_code;
        cancelData.semester = selectedClass.semester;
        cancelData.section = selectedClass.section;
      }

      await timetableService.cancelClass(cancelData);
      
      setShowCancelModal(false);
      setSelectedClass(null);
      setCancelReason('');
      fetchProfessorTimetable();
    } catch (error) {
      setError('Failed to cancel class');
    }
  };

  const handleRestoreClass = async (classEntry) => {
    try {
      const restoreData = {
        day: classEntry.day,
        period_start: classEntry.period_start,
        period_end: classEntry.period_end
      };

      // Add appropriate identifier based on system
      if (classEntry.class_id) {
        restoreData.class_id = classEntry.class_id;
      } else if (classEntry.department_code && classEntry.semester) {
        restoreData.department_code = classEntry.department_code;
        restoreData.semester = classEntry.semester;
        restoreData.section = classEntry.section;
      }

      await timetableService.restoreClass(restoreData);
      
      fetchProfessorTimetable();
    } catch (error) {
      setError('Failed to restore class');
    }
  };

  const openCancelModal = (classEntry) => {
    setSelectedClass(classEntry);
    setShowCancelModal(true);
  };

  const getClassesByDay = (day) => {
    return timetable
      .filter(entry => entry.day === day)
      .sort((a, b) => a.period_start.localeCompare(b.period_start));
  };

  const getStatusColor = (entry) => {
    if (entry.is_cancelled) {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    return 'bg-green-100 border-green-300 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
              <p className="text-gray-600">Your class schedule and status</p>
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
                    <th key={day} className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[200px]">
                      {day}
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
                        <td key={day} className="border border-gray-300 p-2 h-24 align-top">
                          {classEntry ? (
                            <div className={`p-3 rounded-lg h-full ${
                              classEntry.is_cancelled 
                                ? 'bg-red-100 border-l-4 border-red-400' 
                                : 'bg-green-100 border-l-4 border-green-400'
                            }`}>
                              <div className="mb-2">
                                <div className="font-semibold text-sm text-gray-900">
                                  {classEntry.subject || classEntry.subject_code}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {classEntry.class_id ? `Class: ${classEntry.class_id}` : 
                                   `${classEntry.department_code} - Sem ${classEntry.semester}${classEntry.section ? ` (${classEntry.section})` : ''}`}
                                </div>
                              </div>
                              
                              {classEntry.is_cancelled && classEntry.cancel_reason && (
                                <div className="mb-2 p-1 bg-white bg-opacity-50 rounded">
                                  <p className="text-xs text-gray-700 truncate" title={classEntry.cancel_reason}>
                                    Reason: {classEntry.cancel_reason}
                                  </p>
                                </div>
                              )}

                              <div className="flex justify-end space-x-1">
                                {classEntry.is_cancelled ? (
                                  <button
                                    onClick={() => handleRestoreClass(classEntry)}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                    title="Restore Class"
                                  >
                                    Restore
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openCancelModal(classEntry)}
                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                    title="Cancel Class"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
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
          
          {/* Mobile View - Card Layout */}
          <div className="md:hidden mt-6">
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                  <div className="space-y-3">
                    {getClassesByDay(day).length > 0 ? (
                      getClassesByDay(day).map((entry, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 ${getStatusColor(entry)}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{entry.subject || entry.subject_code}</h4>
                              <p className="text-sm opacity-75">
                                {entry.class_id ? `Class: ${entry.class_id}` : 
                                 `${entry.department_code} - Sem ${entry.semester}${entry.section ? ` (${entry.section})` : ''}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {entry.period_start} - {entry.period_end}
                              </p>
                            </div>
                          </div>
                          
                          {entry.is_cancelled && entry.cancel_reason && (
                            <div className="mb-2">
                              <p className="text-xs font-medium">Reason:</p>
                              <p className="text-xs opacity-75">{entry.cancel_reason}</p>
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            {entry.is_cancelled ? (
                              <button
                                onClick={() => handleRestoreClass(entry)}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => openCancelModal(entry)}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
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
      </div>

      {/* Cancel Class Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Class</h3>
              {selectedClass && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Subject:</strong> {selectedClass.subject || selectedClass.subject_code}</p>
                  <p className="text-sm"><strong>Class:</strong> {
                    selectedClass.class_id || 
                    `${selectedClass.department_code} - Sem ${selectedClass.semester}${selectedClass.section ? ` (${selectedClass.section})` : ''}`
                  }</p>
                  <p className="text-sm"><strong>Time:</strong> {selectedClass.day}, {selectedClass.period_start} - {selectedClass.period_end}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Please provide a reason for cancelling this class..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedClass(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelClass}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Cancel Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorTimetableView;