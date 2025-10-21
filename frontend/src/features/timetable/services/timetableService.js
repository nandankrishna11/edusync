/**
 * Timetable service for API calls
 */
import api from '../../../api/client';

export const timetableService = {
  // Get all timetable entries
  async getTimetable(classId = null, day = null) {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (day) params.append('day', day);
    
    const response = await api.get(`/timetable?${params.toString()}`);
    return response.data;
  },

  // Get timetable entry by ID
  async getTimetableById(id) {
    const response = await api.get(`/timetable/${id}`);
    return response.data;
  },

  // Create new timetable entry
  async createTimetableEntry(timetableData) {
    const response = await api.post('/timetable', timetableData);
    return response.data;
  },

  // Update timetable entry
  async updateTimetableEntry(id, updateData) {
    const response = await api.put(`/timetable/${id}`, updateData);
    return response.data;
  },

  // Delete timetable entry
  async deleteTimetableEntry(id) {
    const response = await api.delete(`/timetable/${id}`);
    return response.data;
  },

  // Cancel class
  async cancelClass(cancelData) {
    const response = await api.patch('/timetable/cancel', cancelData);
    return response.data;
  },

  // Restore cancelled class
  async restoreClass(restoreData) {
    const response = await api.patch('/timetable/undo_cancel', restoreData);
    return response.data;
  },

  // Get professor's timetable
  async getProfessorTimetable(professorUsn) {
    const response = await api.get(`/timetable/professor/${professorUsn}`);
    return response.data;
  },

  // Get class status with colors
  async getClassStatus(classId) {
    const response = await api.get(`/timetable/class/${classId}/status`);
    return response.data;
  },

  // Get cancelled classes
  async getCancelledClasses() {
    const response = await api.get('/timetable/cancelled');
    return response.data;
  },

  // Get next class
  async getNextClass(classId) {
    const response = await api.get(`/timetable/next_class?class_id=${classId}`);
    return response.data;
  }
};