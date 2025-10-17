import React, { useState, useEffect } from 'react';
import NotificationCard from './NotificationCard';
import { getNotifications, markNotificationRead, deleteNotification, getNotificationStats } from '../api/services';


const NotificationsList = ({ classId = null, studentId = null }) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    is_read: '',
    limit: 20
  });

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [classId, studentId, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...filters,
        class_id: classId,
        student_id: studentId
      };
      
      // Remove empty filters
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] === '' || filterParams[key] === null || filterParams[key] === undefined) {
          delete filterParams[key];
        }
      });

      const data = await getNotifications(filterParams);
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getNotificationStats(classId);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotification(notificationId);
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        fetchStats(); // Refresh stats
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    try {
      await Promise.all(
        unreadNotifications.map(notif => markNotificationRead(notif.id))
      );
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      fetchStats();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-error">
        <p>❌ {error}</p>
        <button className="btn btn-primary" onClick={fetchNotifications}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="notifications-list">
      <div className="notifications-header">
        <div className="header-title">
          <h2>📢 Notifications</h2>
          {classId && <span className="class-filter">Class: {classId}</span>}
        </div>
        
        {stats && (
          <div className="notifications-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.total_notifications}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item unread">
              <span className="stat-number">{stats.unread_notifications}</span>
              <span className="stat-label">Unread</span>
            </div>
          </div>
        )}
      </div>

      <div className="notifications-controls">
        <div className="filters">
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="cancellation">Cancellations</option>
            <option value="resource">Resources</option>
            <option value="notice">Notices</option>
          </select>

          <select 
            value={filters.is_read} 
            onChange={(e) => handleFilterChange('is_read', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>

          <select 
            value={filters.limit} 
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value={10}>10 items</option>
            <option value={20}>20 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>

        <div className="actions">
          {stats && stats.unread_notifications > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={markAllAsRead}
              title="Mark all notifications as read"
            >
              ✓ Mark All Read ({stats.unread_notifications})
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={fetchNotifications}
            title="Refresh notifications"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="notifications-content">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">📭</div>
            <h3>No notifications found</h3>
            <p>There are no notifications matching your current filters.</p>
          </div>
        ) : (
          <div className="notifications-grid">
            {notifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {stats && (
        <div className="notifications-summary">
          <h4>📊 Summary by Type</h4>
          <div className="type-stats">
            <div className="type-stat cancellation">
              <span className="type-icon">🚫</span>
              <span className="type-count">{stats.by_type.cancellation}</span>
              <span className="type-name">Cancellations</span>
            </div>
            <div className="type-stat resource">
              <span className="type-icon">📚</span>
              <span className="type-count">{stats.by_type.resource}</span>
              <span className="type-name">Resources</span>
            </div>
            <div className="type-stat notice">
              <span className="type-icon">📢</span>
              <span className="type-count">{stats.by_type.notice}</span>
              <span className="type-name">Notices</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;