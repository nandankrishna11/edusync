/**
 * Student Marks View Component
 * Shows subject-wise marks and grades
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import api from '../api/client';

const StudentMarksView = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailedMarks, setDetailedMarks] = useState([]);

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  const fetchStudentDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enhanced/student/dashboard');
      setDashboard(response.data);
    } catch (error) {
      setError('Failed to fetch marks data');
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedMarks = async (subjectCode) => {
    try {
      setLoading(true);
      const response = await api.get(`/enhanced/marks/student/detailed?subject_code=${subjectCode}`);
      setDetailedMarks(response.data.records || []);
      setSelectedSubject(subjectCode);
    } catch (error) {
      setError('Failed to fetch detailed marks');
      console.error('Error fetching detailed marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'text-green-700 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+': return 'text-blue-600 bg-blue-100';
      case 'B': return 'text-blue-500 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Marks & Grades</h1>
            <p className="text-green-100">
              {dashboard?.student_usn} - {dashboard?.department_code} Semester {dashboard?.semester}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{dashboard?.overall_percentage?.toFixed(1)}%</div>
            <div className="text-green-100">Overall Percentage</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-wise Marks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Subject-wise Performance</h2>
            
            {dashboard?.marks_summary?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Marks Available</h3>
                <p className="text-gray-500">Your marks will appear here once assessments are completed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard?.marks_summary?.map((subject, index) => (
                  <div
                    key={subject.subject_code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => fetchDetailedMarks(subject.subject_code)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject.subject_code}</h3>
                        <p className="text-sm text-gray-600">
                          {subject.department_code} Semester {subject.semester}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getPercentageColor(subject.percentage)}`}>
                          {subject.percentage?.toFixed(1)}%
                        </div>
                        <div className={`text-sm px-3 py-1 rounded-full font-medium ${getGradeColor(subject.grade)}`}>
                          Grade: {subject.grade || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Marks Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{subject.ia1_marks}</div>
                        <div className="text-gray-500">IA1</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{subject.ia2_marks}</div>
                        <div className="text-gray-500">IA2</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{subject.ia3_marks}</div>
                        <div className="text-gray-500">IA3</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{subject.final_marks}</div>
                        <div className="text-gray-500">Final</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Total: {subject.total_obtained_marks}/{subject.total_max_marks}</span>
                        <span>{subject.percentage?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            subject.percentage >= 90 ? 'bg-green-500' :
                            subject.percentage >= 80 ? 'bg-blue-500' :
                            subject.percentage >= 70 ? 'bg-yellow-500' :
                            subject.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="lg:col-span-1">
          {/* Overall Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Percentage</span>
                <span className={`font-bold text-xl ${getPercentageColor(dashboard?.overall_percentage || 0)}`}>
                  {dashboard?.overall_percentage?.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Subjects</span>
                <span className="font-bold text-gray-900">
                  {dashboard?.marks_summary?.length || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Department</span>
                <span className="font-bold text-gray-900">
                  {dashboard?.department_code}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Semester</span>
                <span className="font-bold text-gray-900">
                  {dashboard?.semester}
                </span>
              </div>
            </div>
          </div>

          {/* Grade Scale */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Grading Scale</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">90% - 100%</span>
                <span className="px-2 py-1 rounded text-green-700 bg-green-100 font-medium">A+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">80% - 89%</span>
                <span className="px-2 py-1 rounded text-green-600 bg-green-100 font-medium">A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">70% - 79%</span>
                <span className="px-2 py-1 rounded text-blue-600 bg-blue-100 font-medium">B+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">60% - 69%</span>
                <span className="px-2 py-1 rounded text-blue-500 bg-blue-100 font-medium">B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">50% - 59%</span>
                <span className="px-2 py-1 rounded text-yellow-600 bg-yellow-100 font-medium">C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">40% - 49%</span>
                <span className="px-2 py-1 rounded text-orange-600 bg-orange-100 font-medium">D</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Below 40%</span>
                <span className="px-2 py-1 rounded text-red-600 bg-red-100 font-medium">F</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Marks Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Detailed Marks - {selectedSubject}
                </h3>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {detailedMarks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No detailed marks available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assessment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedMarks.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.assessment_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.assessment_type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.assessment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.obtained_marks}/{record.max_marks}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getPercentageColor((record.obtained_marks / record.max_marks) * 100)}`}>
                              {((record.obtained_marks / record.max_marks) * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMarksView;