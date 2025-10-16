import React, { useState } from 'react';
import { createNotification } from '../services/api';


const NotificationCreator = ({ onNotificationCreated, onClose }) => {
  const [formData, setFormData] = useState({
    class_id: '',
    type: 'notice',
    title: '',
    message: '',
    student_id: '',
    metadata: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleMetadataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const validateForm = () => {
    if (!formData.class_id.trim()) {
      setError('Class ID is required');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Message is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const notificationData = {
        class_id: formData.class_id,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        student_id: formData.student_id || null,
        notification_metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : null
      };

      const created = await createNotification(notificationData);
      
      if (onNotificationCreated) {
        onNotificationCreated(created);
      }
      
      // Reset form
      setFormData({
        class_id: '',
        type: 'notice',
        title: '',
        message: '',
        student_id: '',
        metadata: {}
      });

      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to create notification. Please try again.');
      console.error('Error creating notification:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cancellation': return '🚫';
      case 'resource': return '📚';
      case 'notice': return '📢';
      default: return '📝';
    }
  };

  const addMetadataField = () => {
    const key = prompt('Enter metadata key:');
    if (key && key.trim()) {
      handleMetadataChange(key.trim(), '');
    }
  };

  const removeMetadataField = (key) => {
    setFormData(prev => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return {
        ...prev,
        metadata: newMetadata
      };
    });
  };

  return (
    <div className="notification-creator">
      <div className="creator-header">
        <h3>📝 Create New Notification</h3>
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
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="form-input"
            >
              <option value="notice">📢 Notice</option>
              <option value="resource">📚 Resource</option>
              <option value="cancellation">🚫 Cancellation</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="student_id">Target Student (Optional)</label>
          <select
            id="student_id"
            value={formData.student_id}
            onChange={(e) => handleInputChange('student_id', e.target.value)}
            className="form-input"
          >
            <option value="">All students (broadcast)</option>
            {students.map(studentId => (
              <option key={studentId} value={studentId}>{studentId}</option>
            ))}
          </select>
          <small className="form-help">Leave empty to send to all students in the class</small>
        </div>

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="form-input"
            placeholder="Enter notification title..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            className="form-textarea"
            placeholder="Enter notification message..."
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <div className="metadata-header">
            <label>Additional Information (Optional)</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addMetadataField}
            >
              + Add Field
            </button>
          </div>
          
          {Object.keys(formData.metadata).length > 0 && (
            <div className="metadata-fields">
              {Object.entries(formData.metadata).map(([key, value]) => (
                <div key={key} className="metadata-field">
                  <span className="metadata-key">{key}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleMetadataChange(key, e.target.value)}
                    className="metadata-input"
                    placeholder="Enter value..."
                  />
                  <button
                    type="button"
                    className="remove-metadata-btn"
                    onClick={() => removeMetadataField(key)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
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
                Creating...
              </>
            ) : (
              <>
                {getTypeIcon(formData.type)} Create Notification
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

      <div className="creator-preview">
        <h4>📋 Preview</h4>
        <div className="preview-card">
          <div className="preview-header">
            <span className="preview-type">{getTypeIcon(formData.type)} {formData.type.toUpperCase()}</span>
            <span className="preview-class">{formData.class_id || 'CLASS'}</span>
          </div>
          <div className="preview-content">
            <h5>{formData.title || 'Notification Title'}</h5>
            <p>{formData.message || 'Notification message will appear here...'}</p>
            {formData.student_id && (
              <small>Target: {formData.student_id}</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCreator;