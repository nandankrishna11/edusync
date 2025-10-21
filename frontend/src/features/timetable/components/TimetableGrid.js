/**
 * Timetable Grid Component with Color Coding
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { timetableService } from '../services/timetableService';

const TimetableGrid = ({ classId }) => {
  const { user, isProfessor, isAdmin } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { start: '09:00', end: '10:00', label: '1st Period' },
    { start: '10:00', end: '11:00', label: '2nd Period' },
    { start: '11:15', end: '12:15', label: '3rd Period' },
    { start: '12:15', end: '13:15', label: '4th Period' },
    { start: '14:00', end: '15:00', label: '5th Period' },
    { start: '15:00', end: '16:00', label: '6th Period' },
  ];

  useEffect(() => {
    fetchTimetable();
  }, [classId]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const data = await timetableService.getClassStatus(classId);
      setTimetable(data);
    } catch (error) {
      setError('Failed to fetch timetable');
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableEntry = (day, periodStart, periodEnd) => {
    return timetable.find(entry => 
      entry.day === day && 
      entry.period_start === periodStart && 
      entry.period_end === periodEnd
    );
  };

  const getSlotColor = (entry) => {
    if (!entry) return 'bg-gray-50 border-gray-200';
    
    switch (entry.color_code) {
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const handleCancelClass = async () => {
    if (!selectedEntry || !cancelReason.trim()) return;

    try {
      await timetableService.cancelClass({
        class_id: selectedEntry.class_id,
        day: selectedEntry.day,
        period_start: selectedEntry.period_start,
        period_end: selectedEntry.period_end,
        cancel_reason: cancelReason
      });
      
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedEntry(null);
      fetchTimetable();
    } catch (error) {
      setError('Failed to cancel class');
    }
  };

  const handleRestoreClass = async (entry) => {
    try {
      await timetableService.restoreClass({
        class_id: entry.class_id,
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end
      });
      
      fetchTimetable();
    } catch (error) {
      setError('Failed to restore class');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Timetable</h2>
          <p className="text-gray-600">Class: {classId}</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-3 bg-gray-50 text-left font-semibold">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="border border-gray-300 p-3 bg-gray-50 text-center font-semibold">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={`${period.start}-${period.end}`}>
                <td className="border border-gray-300 p-3 bg-gray-50 font-medium">
                  <div className="text-sm">
                    <div>{period.label}</div>
                    <div className="text-gray-500">{period.start} - {period.end}</div>
                  </div>
                </td>
                {days.map(day => {
                  const entry = getTimetableEntry(day, period.start, period.end);
                  return (
                    <td 
                      key={`${day}-${period.start}`} 
                      className={`border border-gray-300 p-3 ${getSlotColor(entry)} relative group cursor-pointer`}
                      onClick={() => entry && setSelectedEntry(entry)}
                    >
                      {entry ? (
                        <div className="text-sm">
                          <div className="font-semibold">{entry.subject}</div>
                          <div className="text-xs opacity-75">Prof: {entry.professor_usn}</div>
                          {entry.is_cancelled && (
                            <div className="text-xs font-medium mt-1">
                              ❌ CANCELLED
                              {entry.cancel_reason && (
                                <div className="text-xs mt-1">{entry.cancel_reason}</div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons for professors */}
                          {(isProfessor() || isAdmin()) && entry.professor_usn === user.user_id && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {entry.is_cancelled ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestoreClass(entry);
                                  }}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                    setShowCancelModal(true);
                                  }}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No class</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Class Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Class</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Cancel {selectedEntry?.subject} on {selectedEntry?.day} 
                  ({selectedEntry?.period_start} - {selectedEntry?.period_end})
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation:
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Enter reason for cancellation..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedEntry(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelClass}
                  disabled={!cancelReason.trim()}
                  className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
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

export default TimetableGrid;