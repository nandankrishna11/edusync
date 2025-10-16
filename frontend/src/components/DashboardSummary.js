import React, { useState, useEffect } from 'react';
import { 
  getNotificationStats, 
  getNotifications,
  getClassAttendanceStats,
  getAttendanceRecords 
} from '../services/api';
import './DashboardSummary.css';

const DashboardSummary = () => {
  const [notificationStats, setNotificationStats] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch notification data
      const [notifStats, recentNotifs] = await Promise.all([
        getNotificationStats(),
        getNotifications({ limit: 5 })
      ]);
      
      setNotificationStats(notifStats);
      setRecentNotifications(recentNotifs);
      
      // Fetch attendance data for CS301 (main class)
      const [attendStats, recentAttend] = await Promise.all([
        getClassAttendanceStats('CS301'),
        getAttendanceRecords({ limit: 10, class_id: 'CS301' })
      ]);
      
      setAttendanceStats(attendStats);
      setRecentAttendance(recentAttend);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'cancellation': return '🚫';
      case 'resource': return '📚';
      case 'notice': return '📢';
      default: return '📝';
    }
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-summary loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-summary error">
        <p>❌ {error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-summary">
      <div className="summary-header">
        <h2>📊 System Overview</h2>
        <button className="refresh-btn" onClick={fetchDashboardData} title="Refresh data">
          🔄
        </button>
      </div>

      <div className="summary-grid">
        {/* Notifications Summary */}
        <div className="summary-card notifications">
          <div className="card-header">
            <h3>📢 Notifications</h3>
            <a href="/notifications" className="view-all-link">View All</a>
          </div>
          
          {notificationStats && (
            <div className="stats-overview">
              <div className="stat-item">
                <span className="stat-number">{notificationStats.total_notifications}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item unread">
                <span className="stat-number">{notificationStats.unread_notifications}</span>
                <span className="stat-label">Unread</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{notificationStats.read_notifications}</span>
                <span className="stat-label">Read</span>
              </div>
            </div>
          )}

          <div className="type-breakdown">
            <h4>By Type</h4>
            {notificationStats && (
              <div className="type-stats">
                <div className="type-item cancellation">
                  <span className="type-icon">🚫</span>
                  <span className="type-count">{notificationStats.by_type.cancellation}</span>
                  <span className="type-name">Cancellations</span>
                </div>
                <div className="type-item resource">
                  <span className="type-icon">📚</span>
                  <span className="type-count">{notificationStats.by_type.resource}</span>
                  <span className="type-name">Resources</span>
                </div>
                <div className="type-item notice">
                  <span className="type-icon">📢</span>
                  <span className="type-count">{notificationStats.by_type.notice}</span>
                  <span className="type-name">Notices</span>
                </div>
              </div>
            )}
          </div>

          <div className="recent-items">
            <h4>Recent Notifications</h4>
            {recentNotifications.length > 0 ? (
              <div className="items-list">
                {recentNotifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className={`item ${notification.is_read ? 'read' : 'unread'}`}>
                    <span className="item-icon">{getNotificationIcon(notification.type)}</span>
                    <div className="item-content">
                      <span className="item-title">{notification.title}</span>
                      <span className="item-meta">
                        {notification.class_id} • {formatDate(notification.created_at)}
                      </span>
                    </div>
                    {!notification.is_read && <div className="unread-dot"></div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-items">No recent notifications</p>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="summary-card attendance">
          <div className="card-header">
            <h3>📊 Attendance (CS301)</h3>
            <a href="/attendance" className="view-all-link">View All</a>
          </div>
          
          {attendanceStats && (
            <div className="stats-overview">
              <div className="stat-item primary">
                <span className="stat-number">{attendanceStats.attendance_rate}%</span>
                <span className="stat-label">Attendance Rate</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{attendanceStats.unique_students}</span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{attendanceStats.total_records}</span>
                <span className="stat-label">Total Records</span>
              </div>
            </div>
          )}

          <div className="attendance-breakdown">
            <h4>Status Breakdown</h4>
            {attendanceStats && (
              <div className="status-stats">
                <div className="status-item present">
                  <span className="status-icon">✅</span>
                  <span className="status-count">{attendanceStats.present_count}</span>
                  <span className="status-name">Present</span>
                </div>
                <div className="status-item absent">
                  <span className="status-icon">❌</span>
                  <span className="status-count">{attendanceStats.absent_count}</span>
                  <span className="status-name">Absent</span>
                </div>
                <div className="status-item cancelled">
                  <span className="status-icon">🚫</span>
                  <span className="status-count">{attendanceStats.cancelled_count}</span>
                  <span className="status-name">Cancelled</span>
                </div>
              </div>
            )}
          </div>

          <div className="recent-items">
            <h4>Recent Attendance</h4>
            {recentAttendance.length > 0 ? (
              <div className="items-list">
                {recentAttendance.slice(0, 3).map(record => (
                  <div key={record.id} className={`item ${record.status}`}>
                    <span className="item-icon">{getAttendanceIcon(record.status)}</span>
                    <div className="item-content">
                      <span className="item-title">{record.student_id}</span>
                      <span className="item-meta">
                        {record.status} • {formatDate(record.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-items">No recent attendance records</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="summary-card actions">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          
          <div className="action-buttons">
            <a href="/notifications" className="action-btn notifications">
              <span className="action-icon">📢</span>
              <span className="action-text">View Notifications</span>
              {notificationStats && notificationStats.unread_notifications > 0 && (
                <span className="action-badge">{notificationStats.unread_notifications}</span>
              )}
            </a>
            
            <a href="/attendance" className="action-btn attendance">
              <span className="action-icon">📊</span>
              <span className="action-text">Manage Attendance</span>
            </a>
            
            <button className="action-btn refresh" onClick={fetchDashboardData}>
              <span className="action-icon">🔄</span>
              <span className="action-text">Refresh Data</span>
            </button>
          </div>

          <div className="system-status">
            <h4>🔧 System Status</h4>
            <div className="status-indicators">
              <div className="status-indicator online">
                <span className="indicator-dot"></span>
                <span className="indicator-text">API Online</span>
              </div>
              <div className="status-indicator online">
                <span className="indicator-dot"></span>
                <span className="indicator-text">Database Connected</span>
              </div>
              <div className="status-indicator online">
                <span className="indicator-dot"></span>
                <span className="indicator-text">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DashboardSummary;