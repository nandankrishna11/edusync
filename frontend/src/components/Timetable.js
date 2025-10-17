import React, { useState, useEffect } from 'react';
import { getTimetable, cancelClass, undoCancelClass } from '../api/services';

const Timetable = ({ userRole = 'student', selectedClassId = 'CS301' }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch timetable data
  useEffect(() => {
    fetchTimetable();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchTimetable, 30000);
    
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const data = await getTimetable(selectedClassId);
      setTimetable(data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      showNotification('Error loading timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCancelClick = (period) => {
    setSelectedPeriod(period);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      showNotification('Please provide a cancellation reason', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const cancelData = {
        class_id: selectedPeriod.class_id,
        day: selectedPeriod.day,
        period_start: selectedPeriod.period_start,
        period_end: selectedPeriod.period_end,
        cancel_reason: cancelReason
      };

      await cancelClass(cancelData);
      
      setShowCancelModal(false);
      setSelectedPeriod(null);
      setCancelReason('');
      
      showNotification(`${selectedPeriod.subject} class cancelled successfully`, 'success');
      
      // Refresh timetable
      await fetchTimetable();
      
    } catch (error) {
      console.error('Error cancelling class:', error);
      showNotification('Error cancelling class', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndoCancel = async (period) => {
    setIsProcessing(true);
    try {
      const undoData = {
        class_id: period.class_id,
        day: period.day,
        period_start: period.period_start,
        period_end: period.period_end
      };

      await undoCancelClass(undoData);
      
      showNotification(`${period.subject} class restored successfully`, 'success');
      
      // Refresh timetable
      await fetchTimetable();
      
    } catch (error) {
      console.error('Error restoring class:', error);
      showNotification('Error restoring class', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Group timetable by day
  const groupedTimetable = timetable.reduce((acc, period) => {
    if (!acc[period.day]) {
      acc[period.day] = [];
    }
    acc[period.day].push(period);
    return acc;
  }, {});

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) {
    return (
      <div className="bg-app-card rounded-app p-6 shadow-app-card">
        <div className="flex items-center justify-center h-32">
          <div className="text-app-text-secondary">Loading timetable...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-app shadow-card-hover transition-all duration-300 ${
          notification.type === 'success' ? 'bg-app-success text-white' :
          notification.type === 'error' ? 'bg-app-danger text-white' :
          'bg-app-primary text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-app-card rounded-app p-6 shadow-app-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text-primary">Class Timetable</h2>
            <p className="text-app-text-secondary mt-1">
              {selectedClassId} - {userRole === 'professor' ? 'Professor View' : 'Student View'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-app-success rounded-full"></div>
            <span className="text-sm text-app-text-secondary">Live Updates</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {dayOrder.map(day => (
          <div key={day} className="bg-app-card rounded-app shadow-app-card overflow-hidden">
            {/* Day Header */}
            <div className="bg-app-primary text-white p-4">
              <h3 className="font-semibold text-center">{day}</h3>
            </div>

            {/* Day's Classes */}
            <div className="p-4 space-y-3">
              {groupedTimetable[day] && groupedTimetable[day].length > 0 ? (
                groupedTimetable[day].map((period, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-app border-2 transition-all duration-300 ${
                      period.is_cancelled
                        ? 'bg-app-danger bg-opacity-10 border-app-danger text-app-danger'
                        : 'bg-app-bg border-app-border hover:border-app-primary hover:shadow-card-hover'
                    }`}
                  >
                    {/* Time */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {period.period_start} - {period.period_end}
                      </span>
                      {period.is_cancelled && (
                        <span className="text-xs bg-app-danger text-white px-2 py-1 rounded-full">
                          CANCELLED
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <h4 className={`font-semibold mb-1 ${
                      period.is_cancelled ? 'text-app-danger' : 'text-app-text-primary'
                    }`}>
                      {period.subject}
                    </h4>

                    {/* Professor */}
                    <p className={`text-sm mb-2 ${
                      period.is_cancelled ? 'text-app-danger opacity-75' : 'text-app-text-secondary'
                    }`}>
                      {period.professor_id.replace('prof_', 'Prof. ')}
                    </p>

                    {/* Cancellation Reason */}
                    {period.is_cancelled && period.cancel_reason && (
                      <div className="bg-app-danger bg-opacity-20 p-2 rounded-app mb-3">
                        <p className="text-xs text-app-danger font-medium">
                          Reason: {period.cancel_reason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {userRole === 'professor' && (
                      <div className="flex space-x-2">
                        {!period.is_cancelled ? (
                          <button
                            onClick={() => handleCancelClick(period)}
                            disabled={isProcessing}
                            className="flex-1 bg-app-danger text-white px-3 py-2 rounded-app text-xs font-medium
                                     hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                          >
                            ❌ Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndoCancel(period)}
                            disabled={isProcessing}
                            className="flex-1 bg-app-success text-white px-3 py-2 rounded-app text-xs font-medium
                                     hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                          >
                            ↩️ Restore
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-app-text-secondary">
                  <p className="text-sm">No classes scheduled</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded-app p-6 w-full max-w-md shadow-card-hover">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-app-text-primary">Cancel Class</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-app-text-secondary hover:text-app-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedPeriod && (
              <div className="mb-6">
                <div className="bg-app-bg p-4 rounded-app mb-4">
                  <h4 className="font-semibold text-app-text-primary">{selectedPeriod.subject}</h4>
                  <p className="text-sm text-app-text-secondary">
                    {selectedPeriod.day}, {selectedPeriod.period_start} - {selectedPeriod.period_end}
                  </p>
                  <p className="text-sm text-app-text-secondary">
                    {selectedPeriod.professor_id.replace('prof_', 'Prof. ')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-text-primary mb-2">
                    Cancellation Reason *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                    placeholder="Please provide a reason for cancelling this class..."
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-app-border rounded-app text-app-text-secondary hover:text-app-text-primary hover:border-app-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={isProcessing || !cancelReason.trim()}
                className="flex-1 bg-app-danger text-white px-4 py-3 rounded-app font-semibold
                         hover:bg-opacity-90 transition-all duration-300 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;