import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useApi } from '../hooks/useApi';

const ProfessorAttendanceManager = () => {
  const { user } = useAuth();
  const { apiCall, loading, error } = useApi();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [bulkStatus, setBulkStatus] = useState('present');

  useEffect(() => {
    if (user && user.role === 'professor') {
      fetchMyClasses();
    }
  }, [user]);

  const fetchMyClasses = async () => {
    try {
      const response = await apiCall('/attendance/professor/my-classes');
      setMyClasses(response.assigned_classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setMyClasses([]);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      const params = new URLSearchParams({
        subject: selectedSubject,
        date_filter: selectedDate
      });
      
      const response = await apiCall(`/attendance/professor/class-students/${selectedClass}?${params.toString()}`);
      setStudents(response.students || []);
      
      // Initialize attendance data
      const initialAttendance = {};
      (response.students || []).forEach(student => {
        initialAttendance[student.usn] = student.attendance_status || 'not_marked';
      });
      setAttendanceData(initialAttendance);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setAttendanceData({});
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchClassStudents();
    }
  }, [selectedClass, selectedSubject, selectedDate]);

  const handleClassSelect = (classData) => {
    setSelectedClass(classData.class_id);
    setSelectedSubject(classData.subject);
    setStudents([]);
    setAttendanceData({});
  };

  const handleAttendanceChange = (usn, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [usn]: status
    }));
  };

  const handleBulkAttendance = () => {
    const newAttendanceData = {};
    students.forEach(student => {
      newAttendanceData[student.usn] = bulkStatus;
    });
    setAttendanceData(newAttendanceData);
  };

  const submitAttendance = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select a class and subject');
      return;
    }

    try {
      const attendanceRecords = students.map(student => ({
        usn: student.usn,
        status: attendanceData[student.usn] || 'absent'
      }));

      const bulkData = {
        class_id: selectedClass,
        date: selectedDate,
        subject: selectedSubject,
        attendance_records: attendanceRecords
      };

      const response = await apiCall('/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData)
      });

      if (response.created_count > 0) {
        alert(`Successfully marked attendance for ${response.created_count} students`);
        fetchClassStudents(); // Refresh the data
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('Some errors occurred:', response.errors);
        alert(`Attendance marked with ${response.errors.length} errors. Check console for details.`);
      }
    } catch (err) {
      console.error('Error submitting attendance:', err);
      alert('Error submitting attendance. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'not_marked': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (user?.role !== 'professor') {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">This page is only accessible to professors.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
        <p className="text-gray-600">Mark attendance for your assigned classes and subjects</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {typeof error === 'string' ? error : 'An error occurred while loading data'}
        </div>
      )}

      {/* My Classes Overview */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">My Assigned Classes</h2>
        </div>
        <div className="p-6">
          {myClasses.length === 0 ? (
            <p className="text-gray-500">No classes assigned to you.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map((classData, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedClass === classData.class_id && selectedSubject === classData.subject
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleClassSelect(classData)}
                >
                  <h3 className="font-semibold text-lg text-gray-900">{classData.subject}</h3>
                  <p className="text-gray-600 mb-2">Class: {classData.class_id}</p>
                  <div className="text-sm text-gray-500">
                    <p>Students: {classData.total_students}</p>
                    <p>Classes Conducted: {classData.attendance_summary.total_classes_conducted}</p>
                    <p className={`font-medium ${getAttendanceColor(classData.attendance_summary.average_attendance)}`}>
                      Avg Attendance: {classData.attendance_summary.average_attendance}%
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-400">Schedule:</p>
                    {classData.schedule.slice(0, 2).map((schedule, idx) => (
                      <p key={idx} className="text-xs text-gray-500">
                        {schedule.day}: {schedule.period_start}-{schedule.period_end}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Marking Section */}
      {selectedClass && selectedSubject && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Mark Attendance - {selectedSubject} ({selectedClass})
            </h2>
          </div>
          <div className="p-6">
            {/* Date Selection and Bulk Actions */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bulk Action
                </label>
                <div className="flex gap-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Mark All Present</option>
                    <option value="absent">Mark All Absent</option>
                    <option value="cancelled">Mark Class Cancelled</option>
                  </select>
                  <button
                    onClick={handleBulkAttendance}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Students List */}
            {students.length === 0 ? (
              <p className="text-gray-500">No students found for this class.</p>
            ) : (
              <>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          USN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mark Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overall %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.usn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.attendance_status || 'not_marked')}`}>
                              {(student.attendance_status || 'not_marked').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={attendanceData[student.usn] || 'not_marked'}
                              onChange={(e) => handleAttendanceChange(student.usn, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="not_marked">Not Marked</option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {student.attendance_percentage !== undefined ? (
                              <span className={getAttendanceColor(student.attendance_percentage)}>
                                {student.attendance_percentage}%
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={submitAttendance}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorAttendanceManager;