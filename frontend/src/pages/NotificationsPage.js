import React, { useState } from 'react';
import NotificationsList from '../components/NotificationsList';
import NotificationCreator from '../components/NotificationCreator';


const NotificationsPage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mock class and student data - in real app, fetch from API
  const classes = ['CS301', 'MATH201', 'ENG101', 'PHYS201'];
  const students = ['student_001', 'student_002', 'student_003', 'student_004', 'student_005'];

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedStudent(''); // Clear student filter when class changes
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    setSelectedClass(''); // Clear class filter when student changes
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedStudent('');
  };

  const handleNotificationCreated = (newNotification) => {
    setRefreshTrigger(prev => prev + 1);
    setShowCreator(false);
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>📢 Notifications Center</h1>
        <p>Stay updated with class announcements, cancellations, and resources</p>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="class-select">Filter by Class:</label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Classes</option>
            {classes.map(classId => (
              <option key={classId} value={classId}>{classId}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="student-select">Filter by Student:</label>
          <select
            id="student-select"
            value={selectedStudent}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Students</option>
            {students.map(studentId => (
              <option key={studentId} value={studentId}>{studentId}</option>
            ))}
          </select>
        </div>

        {(selectedClass || selectedStudent) && (
          <button 
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            🔄 Clear Filters
          </button>
        )}

        <button 
          className="btn btn-primary"
          onClick={() => setShowCreator(true)}
        >
          ➕ Create Notification
        </button>
      </div>

      {showCreator && (
        <div className="creator-modal">
          <div className="modal-backdrop" onClick={() => setShowCreator(false)}></div>
          <div className="modal-content">
            <NotificationCreator 
              onNotificationCreated={handleNotificationCreated}
              onClose={() => setShowCreator(false)}
            />
          </div>
        </div>
      )}

      <div className="notifications-container">
        <NotificationsList 
          classId={selectedClass || null}
          studentId={selectedStudent || null}
          key={refreshTrigger}
        />
      </div>

      <div className="page-info">
        <div className="info-card">
          <h3>📋 About Notifications</h3>
          <ul>
            <li><strong>🚫 Cancellations:</strong> Class cancellations and schedule changes</li>
            <li><strong>📚 Resources:</strong> New materials, slides, and assignments</li>
            <li><strong>📢 Notices:</strong> Important announcements and reminders</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>💡 Tips</h3>
          <ul>
            <li>Click "Mark Read" to mark notifications as read</li>
            <li>Use filters to find specific types of notifications</li>
            <li>Unread notifications are highlighted with a blue indicator</li>
            <li>Check regularly for important updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;