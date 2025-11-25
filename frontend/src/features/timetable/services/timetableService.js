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

  // Get semester status with colors
  async getSemesterStatus(departmentCode, semester, section = 'A') {
    const response = await api.get(`/timetable/semester/${departmentCode}/${semester}/status?section=${section}`);
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
  },

  // Get professors for suggestions
  async getProfessors(department = null) {
    const params = department ? `?department=${department}` : '';
    const response = await api.get(`/timetable/professors${params}`);
    return response.data;
  },

  // Get timetable for specific department/semester
  async getSemesterTimetable(departmentCode, semester, section = 'A') {
    const response = await api.get(`/timetable/semester/${departmentCode}/${semester}/status?section=${section}`);
    return response.data;
  },

  // Get all department-semester combinations
  async getDepartmentCombinations() {
    const response = await api.get('/timetable/departments');
    return response.data;
  },

  // Get semesters for a specific department
  async getDepartmentSemesters(departmentCode) {
    const response = await api.get(`/timetable/department/${departmentCode}/semesters`);
    return response.data;
  },

  // Enhanced timetable endpoints
  async getStudentTimetable() {
    const response = await api.get('/enhanced/timetable/student/my-timetable');
    return response.data;
  },

  async getStudentUpcomingClasses(days = 7) {
    const response = await api.get(`/enhanced/timetable/student/upcoming-classes?days=${days}`);
    return response.data;
  },

  async getProfessorClasses() {
    const response = await api.get('/enhanced/timetable/professor/my-classes');
    return response.data;
  },

  async cancelProfessorClass(timetableId, cancelReason) {
    const response = await api.patch(`/enhanced/timetable/professor/cancel-class/${timetableId}`, {
      cancel_reason: cancelReason
    });
    return response.data;
  },

  async restoreProfessorClass(timetableId) {
    const response = await api.patch(`/enhanced/timetable/professor/restore-class/${timetableId}`);
    return response.data;
  },

  async getAdminSemesterTimetable(departmentCode, semester, section = 'A') {
    const response = await api.get(`/enhanced/timetable/admin/semester-timetable/${departmentCode}/${semester}?section=${section}`);
    return response.data;
  },

  async getAdminDepartmentOverview(departmentCode) {
    const response = await api.get(`/enhanced/timetable/admin/department-overview/${departmentCode}`);
    return response.data;
  },

  async createAdminTimetableEntry(timetableData) {
    const response = await api.post('/enhanced/timetable/admin/create-timetable', timetableData);
    return response.data;
  },

  async deleteAdminTimetableEntry(timetableId) {
    const response = await api.delete(`/enhanced/timetable/admin/delete-timetable/${timetableId}`);
    return response.data;
  }
};