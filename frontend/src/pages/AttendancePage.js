import React, { useState } from 'react';
import AttendanceList from '../components/AttendanceList';
import AttendanceBulkCreator from '../components/AttendanceBulkCreator';


const AttendancePage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'class', 'student'
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mock class and student data - in real app, fetch from API
  const classes = ['CS301', 'MATH201', 'ENG101', 'PHYS201'];
  const students = ['student_001', 'student_002', 'student_003', 'student_004', 'student_005'];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedClass('');
    setSelectedStudent('');
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedStudent('');
    setViewMode('class');
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    setSelectedClass('');
    setViewMode('student');
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedStudent('');
    setViewMode('all');
  };

  const handleAttendanceCreated = (result) => {
    setRefreshTrigger(prev => prev + 1);
    setShowBulkCreator(false);
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1>📊 Attendance Management</h1>
        <p>Track and manage student attendance across all classes</p>
      </div>

      <div className="view-selector">
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('all')}
          >
            📋 All Records
          </button>
          <button
            className={`view-tab ${viewMode === 'class' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('class')}
          >
            🏫 By Class
          </button>
          <button
            className={`view-tab ${viewMode === 'student' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('student')}
          >
            👤 By Student
          </button>
        </div>
      </div>

      <div className="filter-section">
        {viewMode === 'class' && (
          <div className="filter-group">
            <label htmlFor="class-select">Select Class:</label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="filter-select"
            >
              <option value="">Choose a class...</option>
              {classes.map(classId => (
                <option key={classId} value={classId}>{classId}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'student' && (
          <div className="filter-group">
            <label htmlFor="student-select">Select Student:</label>
            <select
              id="student-select"
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="filter-select"
            >
              <option value="">Choose a student...</option>
              {students.map(studentId => (
                <option key={studentId} value={studentId}>{studentId}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedClass || selectedStudent) && (
          <button 
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            🔄 Clear Selection
          </button>
        )}

        <button 
          className="btn btn-primary"
          onClick={() => setShowBulkCreator(true)}
        >
          ➕ Bulk Attendance Entry
        </button>
      </div>

      {showBulkCreator && (
        <div className="creator-modal">
          <div className="modal-backdrop" onClick={() => setShowBulkCreator(false)}></div>
          <div className="modal-content">
            <AttendanceBulkCreator 
              onAttendanceCreated={handleAttendanceCreated}
              onClose={() => setShowBulkCreator(false)}
            />
          </div>
        </div>
      )}

      <div className="attendance-container">
        <AttendanceList 
          classId={selectedClass || null}
          studentId={selectedStudent || null}
          key={refreshTrigger}
        />
      </div>

      <div className="page-info">
        <div className="info-card">
          <h3>📈 Attendance Status</h3>
          <div className="status-legend">
            <div className="legend-item present">
              <span className="legend-icon">✅</span>
              <span className="legend-text">Present - Student attended the class</span>
            </div>
            <div className="legend-item absent">
              <span className="legend-icon">❌</span>
              <span className="legend-text">Absent - Student missed the class</span>
            </div>
            <div className="legend-item cancelled">
              <span className="legend-icon">🚫</span>
              <span className="legend-text">Cancelled - Class was cancelled</span>
            </div>
          </div>
        </div>
        
        <div className="info-card">
          <h3>🔧 Quick Actions</h3>
          <ul>
            <li>Click status buttons to update attendance</li>
            <li>Use date filters to view specific time periods</li>
            <li>View statistics for classes and students</li>
            <li>Delete incorrect records with the delete button</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📊 Understanding Statistics</h3>
          <ul>
            <li><strong>Attendance Rate:</strong> Percentage of classes attended (excludes cancelled)</li>
            <li><strong>Total Records:</strong> All attendance entries including cancelled classes</li>
            <li><strong>Active Classes:</strong> Classes that were not cancelled</li>
            <li><strong>Present/Absent:</strong> Actual attendance vs absences</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;