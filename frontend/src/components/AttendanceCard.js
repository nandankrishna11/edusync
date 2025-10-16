import React from 'react';


const AttendanceCard = ({ record, onUpdate, onDelete, showActions = true }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#2ed573';
      case 'absent':
        return '#ff4757';
      case 'cancelled':
        return '#747d8c';
      default:
        return '#a4b0be';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const handleStatusChange = (newStatus) => {
    if (onUpdate && newStatus !== record.status) {
      onUpdate(record.id, { status: newStatus });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(record.id);
    }
  };

  return (
    <div className={`attendance-card status-${record.status}`}>
      <div className="attendance-header">
        <div className="student-info">
          <div className="student-id">{record.student_id}</div>
          <div className="class-info">
            <span className="class-id">{record.class_id}</span>
            {record.subject && <span className="subject">{record.subject}</span>}
          </div>
        </div>
        
        <div className="status-info">
          <div className="status-badge" style={{ backgroundColor: getStatusColor(record.status) }}>
            <span className="status-icon">{getStatusIcon(record.status)}</span>
            <span className="status-text">{record.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="attendance-details">
        <div className="detail-row">
          <span className="detail-label">📅 Date:</span>
          <span className="detail-value">{formatDate(record.date)}</span>
        </div>
        
        {(record.period_start || record.period_end) && (
          <div className="detail-row">
            <span className="detail-label">⏰ Time:</span>
            <span className="detail-value">
              {formatTime(record.period_start)} - {formatTime(record.period_end)}
            </span>
          </div>
        )}
        
        {record.marked_by && (
          <div className="detail-row">
            <span className="detail-label">👤 Marked by:</span>
            <span className="detail-value">{record.marked_by}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">📝 Created:</span>
          <span className="detail-value">
            {new Date(record.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="attendance-actions">
          <div className="status-buttons">
            <button
              className={`status-btn present ${record.status === 'present' ? 'active' : ''}`}
              onClick={() => handleStatusChange('present')}
              title="Mark as present"
              disabled={record.status === 'cancelled'}
            >
              ✅ Present
            </button>
            <button
              className={`status-btn absent ${record.status === 'absent' ? 'active' : ''}`}
              onClick={() => handleStatusChange('absent')}
              title="Mark as absent"
              disabled={record.status === 'cancelled'}
            >
              ❌ Absent
            </button>
          </div>
          
          <button 
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            title="Delete record"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceCard;