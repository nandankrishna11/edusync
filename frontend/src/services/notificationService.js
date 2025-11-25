/**
 * Notification service for API calls
 */
import api from '../api/client';

export const notificationService = {
  // Admin endpoints
  async createAdminNotification(notificationData) {
    const response = await api.post('/notifications/admin/create', notificationData);
    return response.data;
  },

  async getAllAdminNotifications(limit = 100) {
    const response = await api.get(`/notifications/admin/all?limit=${limit}`);
    return response.data;
  },

  // Professor endpoints
  async createProfessorNotification(notificationData) {
    const response = await api.post('/notifications/professor/create', notificationData);
    return response.data;
  },

  async getProfessorNotifications() {
    const response = await api.get('/notifications/professor/my-notifications');
    return response.data;
  },

  async getProfessorClasses() {
    const response = await api.get('/notifications/professor/my-classes');
    return response.data;
  },

  async createClassNotification(notificationData) {
    const response = await api.post('/notifications/professor/create-class-notification', notificationData);
    return response.data;
  },

  // Student endpoints
  async getStudentNotifications() {
    const response = await api.get('/notifications/student/my-notifications');
    return response.data;
  },

  // General endpoints
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  },

  async updateNotification(id, updateData) {
    const response = await api.put(`/notifications/${id}`, updateData);
    return response.data;
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationService;