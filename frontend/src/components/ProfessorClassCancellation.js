/**
 * Professor Class Cancellation Component
 * Allows professors to cancel and restore their classes
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import api from '../api/client';

const ProfessorClassCancellation = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchProfessorClasses();
  }, []);

  const fetchProfessorClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/enhanced/timetable/professor/my-classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      setError('Failed to fetch your classes');
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async (classId) => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.patch(`/enhanced/timetable/professor/cancel-class/${classId}`, null, {
        params: { cancel_reason: cancelReason }
      });
      
      setSuccess('Class cancelled successfully');
      setShowCancelModal(false);
      setSelectedClass(null);
      setCancelReason('');
      fetchProfessorClasses();
    } catch (error) {
      setError('Failed to cancel class: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClass = async (classId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.patch(`/enhanced/timetable/professor/restore-class/${classId}`);
      
      setSuccess('Class restored successfully');
      fetchProfessorClasses();
    } catch (error) {
      setError('Failed to restore class: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (classSchedule) => {
    setSelectedClass(classSchedule);
    setShowCancelModal(true);
    setCancelReason('');
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">Class Management</h1>
        <p className="text-purple-100">Cancel or restore your scheduled classes</p>
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

      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
          <p className="text-gray-500">You don't have any classes assigned to you</p>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map((classData, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{classData.subject_name}</h3>
                  <p className="text-gray-600">{classData.class_name}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <span>Subject Code: {classData.subject_code}</span>
                    {classData.department_code && (
                      <span>Department: {classData.department_code}</span>
                    )}
                    {classData.semester && (
                      <span>Semester: {classData.semester}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{classData.total_periods}</div>
                  <div className="text-sm text-gray-500">Total Periods</div>
                  {classData.cancelled_periods > 0 && (
                    <div className="text-sm text-red-600 mt-1">
                      {classData.cancelled_periods} Cancelled
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Weekly Schedule:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classData.schedule.map((schedule, scheduleIndex) => (
                    <div
                      key={scheduleIndex}
                      className={`p-4 rounded-lg border-2 ${
                        schedule.is_cancelled
                          ? 'border-red-200 bg-red-50'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{schedule.day}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.is_cancelled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {schedule.is_cancelled ? 'Cancelled' : 'Active'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {schedule.period_start} - {schedule.period_end}
                      </div>

                      {schedule.is_cancelled ? (
                        <div>
                          {schedule.cancel_reason && (
                            <div className="text-xs text-red-600 mb-2">
                              Reason: {schedule.cancel_reason}
                            </div>
                          )}
                          <button
                            onClick={() => handleRestoreClass(schedule.id)}
                            disabled={loading}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            Restore Class
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openCancelModal(schedule)}
                          disabled={loading}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          Cancel Class
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Cancel Class</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedClass(null);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedClass.day}</div>
                  <div className="text-sm text-gray-600">
                    {selectedClass.period_start} - {selectedClass.period_end}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCancelClass(selectedClass.id)}
                  disabled={loading || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Cancelling...' : 'Cancel Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorClassCancellation;