/**
 * Marks Management Service
 */
import api from '../../../api/client';

export const marksService = {
  // Create new mark entry
  async createMark(markData) {
    const response = await api.post('/marks/', markData);
    return response.data;
  },

  // Get marks entered by current professor
  async getProfessorMarks(subjectCode = null) {
    const url = subjectCode 
      ? `/marks/professor?subject_code=${subjectCode}`
      : '/marks/professor';
    const response = await api.get(url);
    return response.data;
  },

  // Get marks for a specific student
  async getStudentMarks(studentId) {
    const response = await api.get(`/marks/student/${studentId}`);
    return response.data;
  },

  // Get marks for a subject
  async getSubjectMarks(subjectCode) {
    const response = await api.get(`/marks/subject/${subjectCode}`);
    return response.data;
  },

  // Update mark entry
  async updateMark(markId, updateData) {
    const response = await api.put(`/marks/${markId}`, updateData);
    return response.data;
  },

  // Delete mark entry
  async deleteMark(markId) {
    const response = await api.delete(`/marks/${markId}`);
    return response.data;
  },

  // Get class statistics
  async getClassStatistics(subjectCode, assessmentType = null) {
    const url = assessmentType
      ? `/marks/statistics/class?subject_code=${subjectCode}&assessment_type=${assessmentType}`
      : `/marks/statistics/class?subject_code=${subjectCode}`;
    const response = await api.get(url);
    return response.data;
  }
};
