/**
 * Authentication service
 */
import api from '../../../api/client';

export const authService = {
  async login(credentials) {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async verifyToken() {
    const response = await api.post('/auth/verify-token');
    return response.data;
  },

  async getUsers(skip = 0, limit = 100) {
    const response = await api.get(`/auth/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  async getRoles() {
    const response = await api.get('/auth/roles');
    return response.data;
  },

  async logout() {
    // Clear token and user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};