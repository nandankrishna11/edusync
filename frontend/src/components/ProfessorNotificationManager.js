/**
 * Professor Notification Management Component
 * Allows professors to create and manage their notifications
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import notificationService from '../services/notificationService';

const ProfessorNotificationManager = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [professorClasses, setProfessorClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'general',
    target_role: 'student',
    target_department: '',
    target_semester: '',
    priority: 'normal'
  });

  const [classFormData, setClassFormData] = useState({
    title: '',
    message: '',
    notification_type: 'general',
    department_code: '',
    semester: '',
    section: 'A',
    priority: 'normal'
  });

  const notificationTypes = [
    { value: 'general', label: 'General' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'marks', label: 'Marks' },
    { value: 'timetable', label: 'Timetable' },
    { value: 'exam', label: 'Exam' },
    { value: 'assignment', label: 'Assignment' }
  ];

  const targetRoles = [
    { value: 'student', label: 'Students' },
    { value: '', label: 'All Users (Global)' }
  ];

  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'CS', label: 'Computer Science' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'EC', label: 'Electronics & Communication' },
    { value: 'CV', label: 'Civil Engineering' },
    { value: 'EE', label: 'Electrical Engineering' },
    { value: 'IT', label: 'Information Technology' }
  ];

  const priorities = [
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'low', label: 'Low' }
  ];

  useEffect(() => {
    fetchNotifications();
    fetchProfessorClasses();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await notificationService.getProfessorNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessorClasses = async () => {
    try {
      const data = await notificationService.getProfessorClasses();
      setProfessorClasses(data.classes || []);
    } catch (error) {
      console.error('Error fetching professor classes:', error);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        notification_type: formData.notification_type,
        target_role: formData.target_role || null,
        target_department: formData.target_department || null,
        target_semester: formData.target_semester ? parseInt(formData.target_semester) : null,
        priority: formData.priority
      };

      const response = await notificationService.createProfessorNotification(notificationData);
      
      setSuccess(`Notification created successfully! Target count: ${response.target_count}`);
      setShowCreateModal(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      setError('Failed to create notification: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await notificationService.deleteNotification(notificationId);
      setSuccess('Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      setError('Failed to delete notification: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassNotification = async (e) => {
    e.preventDefault();
    
    if (!classFormData.title.trim() || !classFormData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    if (!classFormData.department_code || !classFormData.semester) {
      setError('Please select a class');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const notificationData = {
        title: classFormData.title.trim(),
        message: classFormData.message.trim(),
        notification_type: classFormData.notification_type,
        department_code: classFormData.department_code,
        semester: parseInt(classFormData.semester),
        section: classFormData.section,
        priority: classFormData.priority
      };

      const response = await notificationService.createClassNotification(notificationData);
      
      setSuccess(`Class notification created successfully! Target: ${response.target_class} (${response.target_count} students)`);
      setShowClassModal(false);
      resetClassForm();
      fetchNotifications();
    } catch (error) {
      setError('Failed to create class notification: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      notification_type: 'general',
      target_role: 'student',
      target_department: '',
      target_semester: '',
      priority: 'normal'
    });
  };

  const resetClassForm = () => {
    setClassFormData({
      title: '',
      message: '',
      notification_type: 'general',
      department_code: '',
      semester: '',
      section: 'A',
      priority: 'normal'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetDescription = (notification) => {
    let parts = [];
    if (notification.target_role) {
      parts.push(notification.target_role.charAt(0).toUpperCase() + notification.target_role.slice(1) + 's');
    } else {
      parts.push('All Users');
    }
    
    if (notification.target_department) {
      parts.push(`Department: ${notification.target_department}`);
    }
    
    if (notification.target_semester) {
      parts.push(`Semester: ${notification.target_semester}`);
    }
    
    return parts.join(' • ');
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Notifications</h1>
            <p className="text-green-100">Create and manage notifications for your students</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowClassModal(true)}
              className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Notify Class
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              General Notification
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Notifications</h2>
          <p className="text-gray-600">Total: {notifications.length} notifications created</p>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001-1z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Yet</h3>
            <p className="text-gray-500">Create your first notification to communicate with students</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {notification.notification_type}
                      </span>
                      {notification.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Target: {getTargetDescription(notification)}</span>
                      <span>•</span>
                      <span>Reach: ~{notification.target_count} users</span>
                      <span>•</span>
                      <span>Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      disabled={loading}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create Notification</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter notification message"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.notification_type}
                      onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {notificationTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {targetRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                {formData.target_role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department (Optional)</label>
                      <select
                        value={formData.target_department}
                        onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {departments.map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Semester (Optional)</label>
                      <select
                        value={formData.target_semester}
                        onChange={(e) => setFormData({ ...formData, target_semester: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Notification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class Notification Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Notify Specific Class</h3>
                <button
                  onClick={() => {
                    setShowClassModal(false);
                    resetClassForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateClassNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
                  <select
                    value={`${classFormData.department_code}_${classFormData.semester}_${classFormData.section}`}
                    onChange={(e) => {
                      const [dept, sem, sec] = e.target.value.split('_');
                      setClassFormData({
                        ...classFormData,
                        department_code: dept || '',
                        semester: sem || '',
                        section: sec || 'A'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a class you teach</option>
                    {professorClasses.map((classInfo, index) => (
                      <option 
                        key={index} 
                        value={`${classInfo.department_code}_${classInfo.semester}_${classInfo.section}`}
                      >
                        {classInfo.class_name} ({classInfo.subject_count} subjects)
                      </option>
                    ))}
                  </select>
                  {professorClasses.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No classes found. Make sure you have timetable entries assigned.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={classFormData.title}
                    onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={classFormData.message}
                    onChange={(e) => setClassFormData({ ...classFormData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter notification message for this specific class"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={classFormData.notification_type}
                      onChange={(e) => setClassFormData({ ...classFormData, notification_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {notificationTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={classFormData.priority}
                      onChange={(e) => setClassFormData({ ...classFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClassModal(false);
                      resetClassForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Notify Class'}
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

export default ProfessorNotificationManager;