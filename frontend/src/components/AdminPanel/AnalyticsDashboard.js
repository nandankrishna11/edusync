/**
 * Analytics Dashboard - Admin can access attendance and performance analytics of all students
 */
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const AnalyticsDashboard = () => {
  const { apiCall } = useApi();
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [systemOverview, setSystemOverview] = useState(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('CS');
  const [selectedMetric, setSelectedMetric] = useState('attendance');
  const [departmentReport, setDepartmentReport] = useState(null);
  const [message, setMessage] = useState('');

  const departments = [
    { code: 'CS', name: 'Computer Science Engineering', color: 'bg-blue-500' },
    { code: 'ME', name: 'Mechanical Engineering', color: 'bg-green-500' },
    { code: 'EC', name: 'Electronics & Communication', color: 'bg-purple-500' },
    { code: 'CV', name: 'Civil Engineering', color: 'bg-orange-500' },
    { code: 'AI', name: 'Artificial Intelligence & ML', color: 'bg-pink-500' }
  ];

  const metrics = [
    { value: 'attendance', label: 'Attendance Analytics', icon: '📊' },
    { value: 'marks', label: 'Performance Analytics', icon: '📈' },
    { value: 'both', label: 'Combined Analytics', icon: '📋' }
  ];

  useEffect(() => {
    if (activeView === 'overview') {
      fetchSystemOverview();
    } else if (activeView === 'department') {
      fetchDepartmentReport();
    } else if (activeView === 'comparison') {
      fetchDepartmentComparison();
    }
  }, [activeView, selectedDepartment, selectedMetric]);

  const fetchSystemOverview = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/analytics/admin/system-overview');
      setSystemOverview(response);
    } catch (error) {
      console.error('Error fetching system overview:', error);
      setMessage('Error fetching system overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentReport = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (selectedMetric === 'attendance') {
        endpoint = `/attendance/admin/department-report/${selectedDepartment}`;
      } else if (selectedMetric === 'marks') {
        endpoint = `/marks/admin/department-marks-report/${selectedDepartment}`;
      } else {
        // For combined, we'll fetch both
        const [attendanceResponse, marksResponse] = await Promise.all([
          apiCall(`/attendance/admin/department-report/${selectedDepartment}`),
          apiCall(`/marks/admin/department-marks-report/${selectedDepartment}`)
        ]);
        setDepartmentReport({ attendance: attendanceResponse, marks: marksResponse });
        setLoading(false);
        return;
      }
      
      const response = await apiCall(endpoint);
      setDepartmentReport(response);
    } catch (error) {
      console.error('Error fetching department report:', error);
      setMessage('Error fetching department report');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentComparison = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/analytics/admin/department-comparison?metric=${selectedMetric}`);
      setDepartmentAnalytics(response.department_rankings || []);
    } catch (error) {
      console.error('Error fetching department comparison:', error);
      setMessage('Error fetching department comparison');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">Access attendance and performance analytics of all students</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveView('department')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'department'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Department Report
          </button>
          <button
            onClick={() => setActiveView('comparison')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'comparison'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Department Comparison
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {message}
        </div>
      )}

      {/* System Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : systemOverview ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemOverview.system_statistics?.total_students || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👨‍🏫</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Professors</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemOverview.system_statistics?.total_professors || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Departments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemOverview.system_statistics?.total_departments || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Subjects</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemOverview.system_statistics?.total_subjects || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {systemOverview.recent_activity?.attendance_records_week || 0}
                    </div>
                    <p className="text-sm text-gray-600">Attendance Records</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {systemOverview.recent_activity?.marks_entries_week || 0}
                    </div>
                    <p className="text-sm text-gray-600">Marks Entries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {systemOverview.recent_activity?.notifications_week || 0}
                    </div>
                    <p className="text-sm text-gray-600">Notifications Sent</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No system overview data available</p>
            </div>
          )}
        </div>
      )}

      {/* Department Report */}
      {activeView === 'department' && (
        <div className="space-y-6">
          {/* Department and Metric Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Department & Metric</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Department</label>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.code}
                      onClick={() => setSelectedDepartment(dept.code)}
                      className={`w-full p-3 rounded-lg border text-left ${
                        selectedDepartment === dept.code
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${dept.color}`}></div>
                        <div>
                          <div className="font-medium">{dept.code}</div>
                          <div className="text-sm text-gray-500">{dept.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Analytics Type</label>
                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <button
                      key={metric.value}
                      onClick={() => setSelectedMetric(metric.value)}
                      className={`w-full p-3 rounded-lg border text-left ${
                        selectedMetric === metric.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{metric.icon}</span>
                        <div className="font-medium">{metric.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Department Report Results */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : departmentReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {departments.find(d => d.code === selectedDepartment)?.name} - {metrics.find(m => m.value === selectedMetric)?.label}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {departmentReport.overall_statistics?.total_students || 0}
                    </div>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedMetric === 'attendance'
                        ? `${departmentReport.overall_statistics?.department_average_attendance?.toFixed(1) || 0}%`
                        : `${departmentReport.overall_statistics?.department_average?.toFixed(1) || 0}%`
                      }
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedMetric === 'attendance' ? 'Average Attendance' : 'Average Marks'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {departmentReport.overall_statistics?.total_subjects || 0}
                    </div>
                    <p className="text-sm text-gray-600">Total Subjects</p>
                  </div>
                </div>
              </div>

              {/* Student Performance List */}
              {((selectedMetric === 'attendance' && departmentReport.student_wise_report) ||
                (selectedMetric === 'marks' && departmentReport.student_performance)) && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Student Performance</h4>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {(selectedMetric === 'attendance' ? departmentReport.student_wise_report :
                      departmentReport.student_performance || []
                    ).map((student, index) => (
                      <div key={student.usn || index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">
                              {student.usn} • Semester {student.semester}
                            </p>
                          </div>
                          <div className="text-right">
                            {selectedMetric === 'attendance' && (
                              <>
                                <p className={`font-medium ${getPerformanceColor(student.attendance_percentage)}`}>
                                  {student.attendance_percentage?.toFixed(1)}% Attendance
                                </p>
                                <p className="text-sm text-gray-600">
                                  {student.classes_attended}/{student.total_classes} classes
                                </p>
                              </>
                            )}
                            {selectedMetric === 'marks' && (
                              <>
                                <p className={`font-medium ${getPerformanceColor(student.overall_percentage)}`}>
                                  {student.overall_percentage?.toFixed(1)}% Marks
                                </p>
                                <p className="text-sm text-gray-600">
                                  {student.overall_grade} Grade
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a department and metric to view the report</p>
            </div>
          )}
        </div>
      )}

      {/* Department Comparison */}
      {activeView === 'comparison' && (
        <div className="space-y-6">
          {/* Metric Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Comparison Metric</h3>
            <div className="flex space-x-4">
              {metrics.map((metric) => (
                <button
                  key={metric.value}
                  onClick={() => setSelectedMetric(metric.value)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedMetric === metric.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metric.icon} {metric.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Results */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : departmentAnalytics.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">
                  Department Rankings - {metrics.find(m => m.value === selectedMetric)?.label}
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {departmentAnalytics.map((dept, index) => (
                  <div key={dept.department_code} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dept.department_name}</p>
                          <p className="text-sm text-gray-600">{dept.total_students} students</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {selectedMetric === 'attendance' && (
                          <>
                            <p className={`text-lg font-bold ${getPerformanceColor(dept.attendance_percentage)}`}>
                              {dept.attendance_percentage?.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {dept.total_classes} total classes
                            </p>
                          </>
                        )}
                        {selectedMetric === 'marks' && (
                          <>
                            <p className={`text-lg font-bold ${getPerformanceColor(dept.marks_percentage)}`}>
                              {dept.marks_percentage?.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {dept.total_assessments} assessments
                            </p>
                          </>
                        )}
                        {selectedMetric === 'both' && (
                          <>
                            <p className="text-lg font-bold text-gray-900">
                              {(((dept.attendance_percentage || 0) + (dept.marks_percentage || 0)) / 2).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              Att: {dept.attendance_percentage?.toFixed(1)}% • Marks: {dept.marks_percentage?.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No comparison data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;