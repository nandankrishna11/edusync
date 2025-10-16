import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API calls
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Dashboard API calls
export const getDashboardData = async () => {
  const response = await api.get('/dashboard/');
  return response.data;
};

// Class API calls
export const getAllClasses = async () => {
  const response = await api.get('/classes/');
  return response.data;
};

export const createClass = async (classData) => {
  const response = await api.post('/classes/', classData);
  return response.data;
};

export const getClassById = async (classId) => {
  const response = await api.get(`/classes/${classId}`);
  return response.data;
};

export const deleteClass = async (classId) => {
  const response = await api.delete(`/classes/${classId}`);
  return response.data;
};

// Timetable API calls
export const getTimetable = async (classId = null, day = null) => {
  let url = '/timetable/';
  const params = new URLSearchParams();
  
  if (classId) params.append('class_id', classId);
  if (day) params.append('day', day);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

export const getCancelledClasses = async (classId = null) => {
  let url = '/timetable/cancelled';
  if (classId) {
    url += `?class_id=${classId}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

export const cancelClass = async (cancelData) => {
  const response = await api.patch('/timetable/cancel', cancelData);
  return response.data;
};

export const undoCancelClass = async (undoData) => {
  const response = await api.patch('/timetable/undo_cancel', undoData);
  return response.data;
};

export const getNextClass = async (classId) => {
  const response = await api.get(`/timetable/next_class?class_id=${classId}`);
  return response.data;
};

// Notifications API calls
export const getNotifications = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.class_id) params.append('class_id', filters.class_id);
  if (filters.student_id) params.append('student_id', filters.student_id);
  if (filters.notification_type) params.append('notification_type', filters.notification_type);
  if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
  if (filters.limit) params.append('limit', filters.limit);
  
  const url = params.toString() ? `/notifications/?${params.toString()}` : '/notifications/';
  const response = await api.get(url);
  return response.data;
};

export const getNotificationById = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data;
};

export const createNotification = async (notificationData) => {
  const response = await api.post('/notifications/', notificationData);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const updateNotification = async (notificationId, updateData) => {
  const response = await api.put(`/notifications/${notificationId}`, updateData);
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const getNotificationStats = async (classId = null) => {
  const url = classId ? `/notifications/stats/summary?class_id=${classId}` : '/notifications/stats/summary';
  const response = await api.get(url);
  return response.data;
};

// Attendance API calls
export const getAttendanceRecords = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.class_id) params.append('class_id', filters.class_id);
  if (filters.student_id) params.append('student_id', filters.student_id);
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.limit) params.append('limit', filters.limit);
  
  const url = params.toString() ? `/attendance/?${params.toString()}` : '/attendance/';
  const response = await api.get(url);
  return response.data;
};

export const getAttendanceRecord = async (recordId) => {
  const response = await api.get(`/attendance/${recordId}`);
  return response.data;
};

export const createAttendanceRecord = async (attendanceData) => {
  const response = await api.post('/attendance/', attendanceData);
  return response.data;
};

export const updateAttendanceRecord = async (recordId, updateData) => {
  const response = await api.put(`/attendance/${recordId}`, updateData);
  return response.data;
};

export const deleteAttendanceRecord = async (recordId) => {
  const response = await api.delete(`/attendance/${recordId}`);
  return response.data;
};

export const getClassAttendanceStats = async (classId) => {
  const response = await api.get(`/attendance/stats/class/${classId}`);
  return response.data;
};

export const getStudentAttendanceStats = async (studentId, classId = null) => {
  const url = classId ? `/attendance/stats/student/${studentId}?class_id=${classId}` : `/attendance/stats/student/${studentId}`;
  const response = await api.get(url);
  return response.data;
};

export const createBulkAttendance = async (attendanceRecords) => {
  const response = await api.post('/attendance/bulk', attendanceRecords);
  return response.data;
};

// Analytics API calls
export const getStudentSummary = async (studentId, classId = null) => {
  const url = classId ? `/analytics/student_summary?student_id=${studentId}&class_id=${classId}` : `/analytics/student_summary?student_id=${studentId}`;
  const response = await api.get(url);
  return response.data;
};

export const getProfessorSummary = async (professorId, classId = null) => {
  const url = classId ? `/analytics/professor_summary?professor_id=${professorId}&class_id=${classId}` : `/analytics/professor_summary?professor_id=${professorId}`;
  const response = await api.get(url);
  return response.data;
};

export const generateAISummary = async (type, classId) => {
  const response = await api.post('/analytics/ai_summary', {
    type: type,
    class_id: classId
  });
  return response.data;
};

export const getAnalyticsDashboardData = async (classId = null) => {
  const url = classId ? `/analytics/dashboard_data?class_id=${classId}` : '/analytics/dashboard_data';
  const response = await api.get(url);
  return response.data;
};

export default api;