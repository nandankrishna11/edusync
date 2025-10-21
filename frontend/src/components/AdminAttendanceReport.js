import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useApi } from '../hooks/useApi';

const AdminAttendanceReport = () => {
  const { user } = useAuth();
  const { apiCall, loading, error } = useApi();
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    semester: '',
    class_id: '',
    subject: ''
  });
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'professor')) {
      fetchReport();
    }
  }, [user]);

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.subject) params.append('subject', filters.subject);

      const response = await apiCall(`/attendance/admin/semester-report?${params.toString()}`);
      setReportData(response);
    } catch (err) {
      console.error('Error fetching report:', err);
      setReportData(null);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchReport();
  };

  const toggleClassExpansion = (classIndex) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classIndex)) {
      newExpanded.delete(classIndex);
    } else {
      newExpanded.add(classIndex);
    }
    setExpandedClasses(newExpanded);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.class_subject_reports) return;

    const csvData = [];
    csvData.push(['Class ID', 'Subject', 'Student USN', 'Present', 'Absent', 'Total Classes', 'Attendance %']);

    reportData.class_subject_reports.forEach(classReport => {
      classReport.students.forEach(student => {
        csvData.push([
          classReport.class_id,
          classReport.subject,
          student.usn,
          student.present,
          student.absent,
          student.total,
          student.attendance_percentage
        ]);
      });
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin' && user?.role !== 'professor') {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">This page is only accessible to admins and professors.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
        <p className="text-gray-600">Comprehensive attendance analysis by semester, class, and subject</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <input
              type="text"
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              placeholder="e.g., 3, 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class ID
            </label>
            <input
              type="text"
              name="class_id"
              value={filters.class_id}
              onChange={handleFilterChange}
              placeholder="e.g., CS301"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              placeholder="Subject name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          {reportData && reportData.class_subject_reports && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {typeof error === 'string' ? error : 'An error occurred while loading report data'}
        </div>
      )}

      {reportData && (
        <>
          {/* Summary */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Classes</h3>
                <p className="text-3xl font-bold text-blue-600">{reportData.summary.total_classes}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Records</h3>
                <p className="text-3xl font-bold text-green-600">{reportData.summary.total_records}</p>
              </div>
            </div>
          )}

          {/* Class-wise Reports */}
          {reportData.class_subject_reports && reportData.class_subject_reports.length > 0 ? (
            <div className="space-y-6">
              {reportData.class_subject_reports.map((classReport, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border">
                  <div 
                    className="px-6 py-4 border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleClassExpansion(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {classReport.subject} - {classReport.class_id}
                        </h3>
                        <div className="flex gap-6 mt-2 text-sm text-gray-600">
                          <span>Students: {classReport.total_students}</span>
                          <span>Classes: {classReport.total_classes_conducted}</span>
                          <span className={`font-medium ${
                            classReport.average_attendance_percentage >= 85 ? 'text-green-600' :
                            classReport.average_attendance_percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            Avg: {classReport.average_attendance_percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {expandedClasses.has(index) ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {expandedClasses.has(index) && (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student USN
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Classes
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Present
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Absent
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cancelled
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attendance %
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {classReport.students
                              .sort((a, b) => a.usn.localeCompare(b.usn))
                              .map((student, studentIndex) => (
                              <tr key={studentIndex} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {student.usn}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.total}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                  {student.present}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                  {student.absent}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.cancelled}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(student.attendance_percentage)}`}>
                                    {student.attendance_percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Class Statistics */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700">Excellent (≥85%)</h4>
                          <p className="text-2xl font-bold text-green-600">
                            {classReport.students.filter(s => s.attendance_percentage >= 85).length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700">Good (75-84%)</h4>
                          <p className="text-2xl font-bold text-yellow-600">
                            {classReport.students.filter(s => s.attendance_percentage >= 75 && s.attendance_percentage < 85).length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700">Poor (&lt;75%)</h4>
                          <p className="text-2xl font-bold text-red-600">
                            {classReport.students.filter(s => s.attendance_percentage < 75).length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700">Class Average</h4>
                          <p className={`text-2xl font-bold ${
                            classReport.average_attendance_percentage >= 85 ? 'text-green-600' :
                            classReport.average_attendance_percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {classReport.average_attendance_percentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-gray-500">No attendance data found for the selected criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAttendanceReport;