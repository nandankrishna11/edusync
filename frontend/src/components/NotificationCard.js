import React from 'react';


const NotificationCard = ({ notification, onMarkRead, onDelete, showActions = true }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'cancellation':
        return '🚫';
      case 'resource':
        return '📚';
      case 'notice':
        return '📢';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cancellation':
        return '#ff4757';
      case 'resource':
        return '#2ed573';
      case 'notice':
        return '#3742fa';
      default:
        return '#747d8c';
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

  const handleMarkRead = () => {
    if (onMarkRead && !notification.is_read) {
      onMarkRead(notification.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}>
      <div className="notification-header">
        <div className="notification-type" style={{ color: getTypeColor(notification.type) }}>
          <span className="type-icon">{getTypeIcon(notification.type)}</span>
          <span className="type-text">{notification.type.toUpperCase()}</span>
        </div>
        <div className="notification-meta">
          <span className="class-id">{notification.class_id}</span>
          <span className="timestamp">{formatDate(notification.created_at)}</span>
        </div>
      </div>
      
      <div className="notification-content">
        <h3 className="notification-title">{notification.title}</h3>
        <p className="notification-message">{notification.message}</p>
        
        {notification.notification_metadata && (
          <div className="notification-metadata">
            {Object.entries(notification.notification_metadata).map(([key, value]) => (
              <span key={key} className="metadata-item">
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="notification-actions">
          {!notification.is_read && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleMarkRead}
              title="Mark as read"
            >
              ✓ Mark Read
            </button>
          )}
          <button 
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            title="Delete notification"
          >
            🗑️ Delete
          </button>
        </div>
      )}
      
      {!notification.is_read && <div className="unread-indicator"></div>}
    </div>
  );
};

export default NotificationCard;