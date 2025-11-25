/**
 * Chat Service for RAG conversations
 */

const API_BASE_URL = 'http://localhost:8000/api/rag';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const chatService = {
  /**
   * Get student's opted subjects
   */
  async getSubjects() {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch subjects');
    return response.json();
  },

  /**
   * Opt into subjects
   */
  async optInSubjects(subjectCodes) {
    const response = await fetch(`${API_BASE_URL}/subjects/opt-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subjectCodes)
    });
    if (!response.ok) throw new Error('Failed to update subjects');
    return response.json();
  },

  /**
   * Ask a question
   */
  async askQuestion(query, subjectCodes = null, sessionId = null) {
    const body = new FormData();
    body.append('query', query);
    if (subjectCodes && subjectCodes.length > 0) {
      // Send as comma-separated string
      body.append('subject_codes', subjectCodes.join(','));
    }
    if (sessionId) {
      body.append('session_id', sessionId);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get answer');
    }
    return response.json();
  },

  /**
   * Get chat sessions
   */
  async getSessions() {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  /**
   * Get specific session with messages
   */
  async getSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete session');
    return response.json();
  }
};
