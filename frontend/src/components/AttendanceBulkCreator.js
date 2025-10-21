import React, { useState, useEffect } from 'react';
import { createBulkAttendance } from '../api/services';
import { useAuth } from '../features/auth/hooks/useAuth';


const AttendanceBulkCreator = ({ onAttendanceCreated, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    period_start: '',
    period_end: '',
    subject: ''
  });
  const [studentAttendance, setStudentAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Sample data - in real app, fetch from API based on class
  const classes = ['CS301', 'MATH201', 'ENG101', 'PHYS201'];
  const students = ['1MS21CS001', '1MS21CS002', '1MS21CS003', '1MS21CS004', '1MS21CS005'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleStudentStatusChange = (usn, status) => {
    setStudentAttendance(prev => ({
      ...prev,
      [usn]: status
    }));
  };

  const setAllStudentsStatus = (status) => {
    const newAttendance = {};
    students.forEach(usn => {
      newAttendance[usn] = status;
    });
    setStudentAttendance(newAttendance);
  };

  const validateForm = () => {
    if (!formData.class_id.trim()) {
      setError('Class ID is required');
      return false;
    }
    if (!formData.date) {
      setError('Date is required');
      return false;
    }
    const hasAttendance = Object.keys(studentAttendance).some(
      usn => studentAttendance[usn]
    );
    if (!hasAttendance) {
      setError('Please mark attendance for at least one student');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Create bulk attendance data in the new format
      const attendanceRecords = Object.entries(studentAttendance)
        .filter(([_, status]) => status) // Only include students with a status
        .map(([usn, status]) => ({
          usn: usn,
          status: status
        }));

      const bulkData = {
        class_id: formData.class_id,
        date: formData.date,
        period_start: formData.period_start || null,
        period_end: formData.period_end || null,
        subject: formData.subject || null,
        attendance_records: attendanceRecords
      };

      const result = await createBulkAttendance(bulkData);
      setResults(result);
      
      if (onAttendanceCreated) {
        onAttendanceCreated(result);
      }
      
      // Reset form if all successful
      if (result.error_count === 0) {
        setFormData({
          class_id: '',
          date: new Date().toISOString().split('T')[0],
          period_start: '',
          period_end: '',
          subject: ''
        });
        setStudentAttendance({});
      }
    } catch (err) {
      setError('Failed to create attendance records. Please try again.');
      console.error('Error creating bulk attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, cancelled: 0 };
    Object.values(studentAttendance).forEach(status => {
      if (status && counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="attendance-bulk-creator">
      <div className="creator-header">
        <h3>📊 Bulk Attendance Entry</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="creator-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="class_id">Class *</label>
            <select
              id="class_id"
              value={formData.class_id}
              onChange={(e) => handleInputChange('class_id', e.target.value)}
              className="form-input"
              required
            >
              <option value="">Select a class...</option>
              {classes.map(classId => (
                <option key={classId} value={classId}>{classId}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="period_start">Start Time</label>
            <input
              type="time"
              id="period_start"
              value={formData.period_start}
              onChange={(e) => handleInputChange('period_start', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="period_end">End Time</label>
            <input
              type="time"
              id="period_end"
              value={formData.period_end}
              onChange={(e) => handleInputChange('period_end', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="form-input"
              placeholder="e.g., Data Structures"
            />
          </div>

          <div className="form-group">
            <label htmlFor="marked_by">Marked By</label>
            <input
              type="text"
              id="marked_by"
              value={user?.user_id || user?.full_name || 'Current User'}
              className="form-input"
              disabled
            />
          </div>
        </div>

        <div className="attendance-section">
          <div className="attendance-header">
            <h4>👥 Student Attendance</h4>
            <div className="bulk-actions">
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => setAllStudentsStatus('present')}
              >
                ✅ All Present
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setAllStudentsStatus('absent')}
              >
                ❌ All Absent
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAllStudentsStatus('cancelled')}
              >
                🚫 Class Cancelled
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setStudentAttendance({})}
              >
                🔄 Clear All
              </button>
            </div>
          </div>

          <div className="students-grid">
            {students.map(usn => (
              <div key={usn} className="student-row">
                <div className="student-info">
                  <span className="student-usn">{usn}</span>
                </div>
                <div className="status-buttons">
                  <button
                    type="button"
                    className={`status-btn present ${studentAttendance[usn] === 'present' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(usn, 'present')}
                  >
                    ✅
                  </button>
                  <button
                    type="button"
                    className={`status-btn absent ${studentAttendance[usn] === 'absent' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(usn, 'absent')}
                  >
                    ❌
                  </button>
                  <button
                    type="button"
                    className={`status-btn cancelled ${studentAttendance[usn] === 'cancelled' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(usn, 'cancelled')}
                  >
                    🚫
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="attendance-summary">
            <div className="summary-item present">
              <span className="summary-count">{statusCounts.present}</span>
              <span className="summary-label">Present</span>
            </div>
            <div className="summary-item absent">
              <span className="summary-count">{statusCounts.absent}</span>
              <span className="summary-label">Absent</span>
            </div>
            <div className="summary-item cancelled">
              <span className="summary-count">{statusCounts.cancelled}</span>
              <span className="summary-label">Cancelled</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {results && (
          <div className="results-message">
            <div className="results-header">
              <h4>📋 Bulk Creation Results</h4>
            </div>
            <div className="results-stats">
              <div className="result-stat success">
                <span className="stat-number">{results.created_count}</span>
                <span className="stat-label">Created</span>
              </div>
              <div className="result-stat error">
                <span className="stat-number">{results.error_count}</span>
                <span className="stat-label">Errors</span>
              </div>
            </div>
            {results.errors && results.errors.length > 0 && (
              <div className="error-details">
                <h5>❌ Errors:</h5>
                <ul>
                  {results.errors.map((error, index) => (
                    <li key={index}>{error.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Records...
              </>
            ) : (
              <>
                📊 Create Attendance Records ({Object.keys(studentAttendance).filter(usn => studentAttendance[usn]).length})
              </>
            )}
          </button>
          
          {onClose && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AttendanceBulkCreator;