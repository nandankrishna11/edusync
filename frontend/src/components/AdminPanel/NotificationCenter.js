/**
 * Notification Center - Admin can post global or department-specific notifications
 */
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const NotificationCenter = () => {
  const { apiCall } = useApi();
  const [activeView, setActiveView] = useState('create');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    target_type: 'global',
    target_value: '',
    priority: 'normal',
    notification_type: 'general',
    expires_at: '',
    is_pinned: false
  });

  // Edit state
  const [editingNotification, setEditingNotification] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const departments = [
    { code: 'CS', name: 'Computer Science Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EC', name: 'Electronics & Communication' },
    { code: 'CV', name: 'Civil Engineering' },
    { code: 'AI', name: 'Artificial Intelligence & ML' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const typeOptions = [
    { value: 'general', label: 'General', icon: '📢' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'exam', label: 'Exam', icon: '📝' },
    { value: 'event', label: 'Event', icon: '🎉' }
  ];

  useEffect(() => {
    if (activeView === 'manage') {
      fetchNotifications();
    }
  }, [activeView]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/simple-notifications/admin/all?limit=50');
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setMessage('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...notificationForm,
        expires_at: notificationForm.expires_at || null
      };

      await apiCall('/simple-notifications/admin/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setMessage('✓ Notification created successfully!');
      
      // Reset form
      setNotificationForm({
        title: '',
        message: '',
        target_type: 'global',
        target_value: '',
        priority: 'normal',
        notification_type: 'general',
        expires_at: '',
        is_pinned: false
      });

      // Refresh notifications if in manage view
      if (activeView === 'manage') {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('✗ Failed to create notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    try {
      await apiCall(`/simple-notifications/admin/${notificationId}`, {
        method: 'DELETE'
      });
      
      setMessage('✓ Notification deleted successfully!');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setMessage('✗ Failed to delete notification');
    }
  };

  const editNotification = async (notificationId) => {
    try {
      const notification = await apiCall(`/simple-notifications/admin/${notificationId}`);
      
      // Extract data from notification and metadata
      const metadata = notification.notification_metadata || {};
      
      setEditingNotification(notification);
      setNotificationForm({
        title: notification.title || '',
        message: notification.message || '',
        target_type: metadata.target_type || 'global',
        target_value: metadata.target_value || '',
        priority: metadata.priority || 'normal',
        notification_type: notification.type || 'general',
        expires_at: '',
        is_pinned: false
      });
      
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching notification for edit:', error);
      setMessage('✗ Failed to load notification for editing');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...notificationForm,
        expires_at: notificationForm.expires_at || null
      };

      await apiCall(`/simple-notifications/admin/${editingNotification.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setMessage('✓ Notification updated successfully!');
      setShowEditModal(false);
      setEditingNotification(null);
      
      // Reset form
      setNotificationForm({
        title: '',
        message: '',
        target_type: 'global',
        target_value: '',
        priority: 'normal',
        notification_type: 'general',
        expires_at: '',
        is_pinned: false
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      setMessage('✗ Failed to update notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTargetDisplay = (notification) => {
    // Extract target info from metadata if available
    const metadata = notification.notification_metadata || {};
    const target_type = metadata.target_type || 'global';
    const target_value = metadata.target_value || '';
    
    switch (target_type) {
      case 'global':
        return 'All Users';
      case 'department':
        const dept = departments.find(d => d.code === target_value);
        return dept ? dept.name : target_value;
      case 'semester':
        return `Semester ${target_value}`;
      case 'individual':
        return `Student: ${target_value}`;
      default:
        return target_type || 'All Users';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    // Check if priority is in metadata
    const actualPriority = typeof priority === 'object' ? priority.priority : priority;
    const option = priorityOptions.find(p => p.value === actualPriority);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const option = typeOptions.find(t => t.value === type);
    return option ? option.icon : '📢';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
          <p className="text-gray-600 mt-1">Create and manage global or department-specific notifications</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('create')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Create Notification
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'manage'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Manage Notifications
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Create Notification */}
      {activeView === 'create' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Notification</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter notification title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={notificationForm.notification_type}
                  onChange={(e) => setNotificationForm({...notificationForm, notification_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {typeOptions.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your notification message..."
                required
              />
            </div>

            {/* Target and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={notificationForm.target_type}
                  onChange={(e) => setNotificationForm({
                    ...notificationForm, 
                    target_type: e.target.value,
                    target_value: e.target.value === 'global' ? '' : notificationForm.target_value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="global">🌍 All Users</option>
                  <option value="department">🏢 Department</option>
                  <option value="semester">📚 Semester</option>
                  <option value="individual">👤 Individual Student</option>
                </select>
              </div>

              {notificationForm.target_type !== 'global' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {notificationForm.target_type === 'department' && 'Department'}
                    {notificationForm.target_type === 'semester' && 'Semester Number'}
                    {notificationForm.target_type === 'individual' && 'Student USN'}
                  </label>
                  {notificationForm.target_type === 'department' ? (
                    <select
                      value={notificationForm.target_value}
                      onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                        <option key={`dept-${index}-${dept.code}`} value={dept.code}>{dept.name}</option>
                      ))}
                    </select>
                  ) : notificationForm.target_type === 'semester' ? (
                    <select
                      value={notificationForm.target_value}
                      onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={notificationForm.target_value}
                      onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 4KV22CS001"
                      required
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm({...notificationForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {priorityOptions.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={notificationForm.expires_at}
                  onChange={(e) => setNotificationForm({...notificationForm, expires_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={notificationForm.is_pinned}
                  onChange={(e) => setNotificationForm({...notificationForm, is_pinned: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_pinned" className="ml-2 text-sm text-gray-700">
                  Pin this notification (appears at top)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Notifications */}
      {activeView === 'manage' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Manage Notifications</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all system notifications</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getTypeIcon(notification.notification_type || notification.type || 'general')}</span>
                        <h4 className="text-lg font-medium text-gray-900">{notification.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority || (notification.notification_metadata && notification.notification_metadata.priority) || 'normal')}`}>
                          {((notification.priority || (notification.notification_metadata && notification.notification_metadata.priority) || 'normal')).toUpperCase()}
                        </span>
                        {(notification.is_pinned || (notification.notification_metadata && notification.notification_metadata.is_pinned)) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            PINNED
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (notification.is_active !== false) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(notification.is_active !== false) ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 Target: {getTargetDisplay(notification)}</span>
                        <span>👤 Created by: {notification.created_by || (notification.notification_metadata && notification.notification_metadata.created_by) || 'System'}</span>
                        <span>📅 {new Date(notification.created_at).toLocaleDateString()}</span>
                        {notification.expires_at && (
                          <span>⏰ Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>

                      {notification.target_count !== undefined && (
                        <div className="mt-2 text-sm text-gray-600">
                          📊 Reach: {notification.target_count} users • 
                          Read: {notification.read_count || 0} ({notification.read_percentage || 0}%)
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => editNotification(notification.id)}
                        className="px-3 py-1 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="Edit notification"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="px-3 py-1 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                        title="Delete notification"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first notification to get started.</p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveView('create')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Create Notification
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Notification Modal */}
      {showEditModal && editingNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Edit Notification</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter notification title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={notificationForm.notification_type}
                      onChange={(e) => setNotificationForm({...notificationForm, notification_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {typeOptions.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your notification message..."
                    required
                  />
                </div>

                {/* Target and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={notificationForm.target_type}
                      onChange={(e) => setNotificationForm({
                        ...notificationForm, 
                        target_type: e.target.value,
                        target_value: e.target.value === 'global' ? '' : notificationForm.target_value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="global">🌍 All Users</option>
                      <option value="department">🏢 Department</option>
                      <option value="semester">📚 Semester</option>
                      <option value="individual">👤 Individual Student</option>
                    </select>
                  </div>

                  {notificationForm.target_type !== 'global' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {notificationForm.target_type === 'department' && 'Department'}
                        {notificationForm.target_type === 'semester' && 'Semester Number'}
                        {notificationForm.target_type === 'individual' && 'Student USN'}
                      </label>
                      {notificationForm.target_type === 'department' ? (
                        <select
                          value={notificationForm.target_value}
                          onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept, index) => (
                            <option key={`edit-dept-${index}-${dept.code}`} value={dept.code}>{dept.name}</option>
                          ))}
                        </select>
                      ) : notificationForm.target_type === 'semester' ? (
                        <select
                          value={notificationForm.target_value}
                          onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select Semester</option>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={`edit-sem-${sem}`} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={notificationForm.target_value}
                          onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value.toUpperCase()})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., 4KV22CS001"
                          required
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={notificationForm.priority}
                      onChange={(e) => setNotificationForm({...notificationForm, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {priorityOptions.map(priority => (
                        <option key={`edit-priority-${priority.value}`} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingNotification(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Notification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;