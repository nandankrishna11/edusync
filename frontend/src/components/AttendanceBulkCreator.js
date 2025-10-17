import React, { useState } from 'react';
import { createBulkAttendance } from '../api/services';


const AttendanceBulkCreator = ({ onAttendanceCreated, onClose }) => {
  const [formData, setFormData] = useState({
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    period_start: '',
    period_end: '',
    subject: '',
    marked_by: ''
  });
  const [studentAttendance, setStudentAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Mock data - in real app, fetch from API
  const classes = ['CS301', 'MATH201', 'ENG101', 'PHYS201'];
  const students = ['student_001', 'student_002', 'student_003', 'student_004', 'student_005'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleStudentStatusChange = (studentId, status) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const setAllStudentsStatus = (status) => {
    const newAttendance = {};
    students.forEach(studentId => {
      newAttendance[studentId] = status;
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
    if (!formData.marked_by.trim()) {
      setError('Marked by is required');
      return false;
    }
    
    const hasAttendance = Object.keys(studentAttendance).some(
      studentId => studentAttendance[studentId]
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
      // Create attendance records for all students with status
      const attendanceRecords = Object.entries(studentAttendance)
        .filter(([_, status]) => status) // Only include students with a status
        .map(([studentId, status]) => ({
          class_id: formData.class_id,
          student_id: studentId,
          date: formData.date,
          status: status,
          marked_by: formData.marked_by,
          period_start: formData.period_start || null,
          period_end: formData.period_end || null,
          subject: formData.subject || null
        }));

      const result = await createBulkAttendance(attendanceRecords);
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
          subject: '',
          marked_by: ''
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
            <label htmlFor="marked_by">Marked By *</label>
            <input
              type="text"
              id="marked_by"
              value={formData.marked_by}
              onChange={(e) => handleInputChange('marked_by', e.target.value)}
              className="form-input"
              placeholder="Professor name"
              required
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
            {students.map(studentId => (
              <div key={studentId} className="student-row">
                <div className="student-info">
                  <span className="student-id">{studentId}</span>
                </div>
                <div className="status-buttons">
                  <button
                    type="button"
                    className={`status-btn present ${studentAttendance[studentId] === 'present' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(studentId, 'present')}
                  >
                    ✅
                  </button>
                  <button
                    type="button"
                    className={`status-btn absent ${studentAttendance[studentId] === 'absent' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(studentId, 'absent')}
                  >
                    ❌
                  </button>
                  <button
                    type="button"
                    className={`status-btn cancelled ${studentAttendance[studentId] === 'cancelled' ? 'active' : ''}`}
                    onClick={() => handleStudentStatusChange(studentId, 'cancelled')}
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
                📊 Create Attendance Records ({Object.keys(studentAttendance).filter(id => studentAttendance[id]).length})
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