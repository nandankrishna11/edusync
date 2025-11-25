/**
 * Textbook Service
 * API calls for textbook RAG functionality
 */

const API_BASE_URL = 'http://localhost:8000/api/textbooks';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const textbookService = {
  /**
   * Upload a textbook PDF
   */
  async uploadTextbook(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    if (metadata.subject_code) formData.append('subject_code', metadata.subject_code);
    if (metadata.department_code) formData.append('department_code', metadata.department_code);
    if (metadata.semester) formData.append('semester', metadata.semester);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  /**
   * List textbooks
   */
  async listTextbooks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.subject_code) params.append('subject_code', filters.subject_code);
    if (filters.department_code) params.append('department_code', filters.department_code);

    const response = await fetch(`${API_BASE_URL}/list?${params}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch textbooks');
    return response.json();
  },

  /**
   * Get textbook details
   */
  async getTextbook(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch textbook');
    return response.json();
  },

  /**
   * Delete textbook
   */
  async deleteTextbook(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete textbook');
    return response.json();
  },

  /**
   * Search textbooks using RAG
   */
  async searchTextbooks(query, filters = {}) {
    const formData = new FormData();
    formData.append('query', query);
    if (filters.textbook_ids) formData.append('textbook_ids', filters.textbook_ids);
    if (filters.subject_code) formData.append('subject_code', filters.subject_code);
    if (filters.top_k) formData.append('top_k', filters.top_k);

    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Search failed');
    }

    return response.json();
  },

  /**
   * Get search history
   */
  async getSearchHistory(limit = 20) {
    const response = await fetch(`${API_BASE_URL}/search/history?limit=${limit}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch search history');
    return response.json();
  },

  /**
   * Submit feedback on search result
   */
  async submitFeedback(searchId, feedback) {
    const formData = new FormData();
    formData.append('feedback', feedback);

    const response = await fetch(`${API_BASE_URL}/search/${searchId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) throw new Error('Failed to submit feedback');
    return response.json();
  },

  /**
   * Get PDF URL
   */
  getPdfUrl(textbookId) {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/${textbookId}/pdf?token=${token}`;
  }
};
