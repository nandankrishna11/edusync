/**
 * Enhanced Student Attendance View
 * Shows subject-wise attendance with detailed reports
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import api from '../api/client';

const StudentAttendanceView = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailedRecords, setDetailedRecords] = useState([]);

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  const fetchStudentDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enhanced/student/dashboard');
      setDashboard(response.data);
    } catch (error) {
      setError('Failed to fetch attendance data');
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedRecords = async (subjectCode) => {
    try {
      setLoading(true);
      const response = await api.get(`/enhanced/attendance/student/detailed?subject_code=${subjectCode}`);
      setDetailedRecords(response.data.records || []);
      setSelectedSubject(subjectCode);
    } catch (error) {
      setError('Failed to fetch detailed records');
      console.error('Error fetching detailed records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 65) return 'Warning';
    return 'Critical';
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
            <p className="text-blue-100">
              {dashboard?.student_usn} - {dashboard?.department_code} Semester {dashboard?.semester}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{dashboard?.overall_attendance?.toFixed(1)}%</div>
            <div className="text-blue-100">Overall Attendance</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-wise Attendance */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Subject-wise Attendance</h2>
            
            {dashboard?.attendance_summary?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                <p className="text-gray-500">Your attendance records will appear here once classes begin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard?.attendance_summary?.map((subject, index) => (
                  <div
                    key={subject.subject_code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => fetchDetailedRecords(subject.subject_code)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject.subject_code}</h3>
                        <p className="text-sm text-gray-600">
                          {subject.department_code} Semester {subject.semester}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getAttendanceColor(subject.attendance_percentage).split(' ')[0]}`}>
                          {subject.attendance_percentage?.toFixed(1)}%
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getAttendanceColor(subject.attendance_percentage)}`}>
                          {getAttendanceStatus(subject.attendance_percentage)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{subject.total_classes}</div>
                        <div className="text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{subject.present_count}</div>
                        <div className="text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{subject.absent_count}</div>
                        <div className="text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-600">{subject.cancelled_count}</div>
                        <div className="text-gray-500">Cancelled</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            subject.attendance_percentage >= 85 ? 'bg-green-500' :
                            subject.attendance_percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(subject.attendance_percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary & Details */}
        <div className="lg:col-span-1">
          {/* Overall Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Attendance</span>
                <span className={`font-bold ${getAttendanceColor(dashboard?.overall_attendance || 0).split(' ')[0]}`}>
                  {dashboard?.overall_attendance?.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Subjects</span>
                <span className="font-bold text-gray-900">
                  {dashboard?.attendance_summary?.length || 0}
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

          {/* Attendance Guidelines */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Guidelines</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">85%+ : Excellent (Eligible for all exams)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">75-84% : Good (Eligible for exams)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">65-74% : Warning (Improvement needed)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">&lt;65% : Critical (May not be eligible)</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Minimum 75% attendance is required to be eligible for semester exams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Records Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Detailed Attendance - {selectedSubject}
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
              
              {detailedRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No detailed records available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marked By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.period_start} - {record.period_end}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.professor_usn}
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

export default StudentAttendanceView;