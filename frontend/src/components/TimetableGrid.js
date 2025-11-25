import React from 'react';

const TimetableGrid = ({ timetable, userRole, onCancelClass, onRestoreClass, loading }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { start: '09:00', end: '10:00', label: '9:00-10:00' },
    { start: '10:00', end: '11:00', label: '10:00-11:00' },
    { start: '11:15', end: '12:15', label: '11:15-12:15' },
    { start: '12:15', end: '13:15', label: '12:15-13:15' },
    { start: '14:00', end: '15:00', label: '14:00-15:00' },
    { start: '15:00', end: '16:00', label: '15:00-16:00' }
  ];

  // Create a grid structure
  const createTimetableGrid = () => {
    const grid = {};
    
    // Initialize empty grid
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period.start] = null;
      });
    });

    // Fill grid with timetable data
    timetable.forEach(entry => {
      if (grid[entry.day] && grid[entry.day].hasOwnProperty(entry.period_start)) {
        grid[entry.day][entry.period_start] = entry;
      }
    });

    return grid;
  };

  const grid = createTimetableGrid();

  const handleCancelClass = (entry) => {
    if (window.confirm(`Are you sure you want to cancel ${entry.subject_code} class?`)) {
      onCancelClass({
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end,
        department_code: entry.department_code,
        semester: entry.semester,
        section: entry.section,
        reason: 'Cancelled by professor'
      });
    }
  };

  const handleRestoreClass = (entry) => {
    if (window.confirm(`Are you sure you want to restore ${entry.subject_code} class?`)) {
      onRestoreClass({
        day: entry.day,
        period_start: entry.period_start,
        period_end: entry.period_end,
        department_code: entry.department_code,
        semester: entry.semester,
        section: entry.section
      });
    }
  };

  const renderCell = (entry, day, period) => {
    if (!entry) {
      return (
        <div className="h-20 p-2 border border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-400 text-center mt-6">Free</div>
        </div>
      );
    }

    const isCancelled = entry.is_cancelled;
    const canModify = userRole === 'professor' && entry.professor_usn === entry.current_user_id;
    const isAdmin = userRole === 'admin';

    return (
      <div className={`h-20 p-2 border border-gray-200 relative ${
        isCancelled ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="text-xs font-semibold text-gray-800 truncate">
          {entry.subject_code}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {entry.professor_usn}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {entry.department_code} {entry.semester}{entry.section}
        </div>
        
        {isCancelled && (
          <div className="absolute top-1 right-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Cancelled
            </span>
          </div>
        )}

        {(canModify || isAdmin) && (
          <div className="absolute bottom-1 right-1 flex space-x-1">
            {!isCancelled ? (
              <button
                onClick={() => handleCancelClass(entry)}
                disabled={loading}
                className="text-xs bg-red-500 text-white px-1 py-0.5 rounded hover:bg-red-600 disabled:opacity-50"
                title="Cancel Class"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => handleRestoreClass(entry)}
                disabled={loading}
                className="text-xs bg-green-500 text-white px-1 py-0.5 rounded hover:bg-green-600 disabled:opacity-50"
                title="Restore Class"
              >
                Restore
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.start} className="border-t border-gray-200">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-r border-gray-200">
                  {period.label}
                </td>
                {days.map(day => (
                  <td key={`${day}-${period.start}`} className="p-0">
                    {renderCell(grid[day][period.start], day, period)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableGrid;