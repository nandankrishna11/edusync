/**
 * Authentication service
 */
import api from '../../../api/client';

export const authService = {
  async login(credentials) {
    console.log('AuthService: Attempting login for user:', credentials.user_id);
    
    // Try the new user_id-based login endpoint first
    try {
      console.log('AuthService: Trying /auth/login endpoint');
      const response = await api.post('/auth/login', {
        user_id: credentials.user_id,
        password: credentials.password
      });
      console.log('AuthService: Login successful via /auth/login');
      return response.data;
    } catch (error) {
      console.log('AuthService: /auth/login failed, trying /auth/token fallback');
      
      // Fallback to token endpoint for backward compatibility
      try {
        const formData = new FormData();
        formData.append('username', credentials.user_id);  // Send user_id as username for OAuth2 compatibility
        formData.append('password', credentials.password);
        
        const response = await api.post('/auth/token', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('AuthService: Login successful via /auth/token');
        return response.data;
      } catch (fallbackError) {
        console.error('AuthService: Both login methods failed');
        console.error('Primary error:', error.response?.data || error.message);
        console.error('Fallback error:', fallbackError.response?.data || fallbackError.message);
        throw fallbackError;
      }
    }
  },

  async register(userData) {
    const response = await api.post('/auth/register', {
      user_id: userData.user_id,
      password: userData.password,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role || 'student'
    });
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

  async getUsers(skip = 0, limit = 1000) {
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