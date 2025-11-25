/**
 * Enhanced Professor Attendance Manager
 * USN-based attendance marking with automatic class generation
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import api from '../api/client';

const ProfessorAttendanceManager = () => {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    fetchAssignedClasses();
  }, []);

  const fetchAssignedClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enhanced/attendance/professor/classes');
      setAssignedClasses(response.data.assigned_classes || []);
    } catch (error) {
      setError('Failed to fetch assigned classes');
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classInfo) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        department_code: classInfo.department_code,
        semester: classInfo.semester.toString(),
        section: classInfo.section,
        subject_code: classInfo.subject_code,
        date_filter: attendanceDate
      });

      const response = await api.get(`/enhanced/attendance/class-students?${params}`);
      setStudents(response.data.students || []);
      setSelectedClass(classInfo);
      
      // Initialize attendance data
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student.student_usn] = student.attendance_status || 'present';
      });
      setAttendanceData(initialAttendance);
      
    } catch (error) {
      setError('Failed to fetch class students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentUsn, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentUsn]: status
    }));
  };

  const submitAttendance = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      setError('');

      // Prepare attendance records
      const attendanceRecords = students.map(student => ({
        student_usn: student.student_usn,
        status: attendanceData[student.student_usn] || 'present'
      }));

      const bulkData = {
        department_code: selectedClass.department_code,
        semester: selectedClass.semester,
        section: selectedClass.section,
        subject_code: selectedClass.subject_code,
        date: attendanceDate,
        period_start: "09:00", // Default period
        period_end: "10:00",
        professor_usn: user.user_id,
        attendance_records: attendanceRecords
      };

      const response = await api.post('/enhanced/attendance/bulk', bulkData);
      
      if (response.data.created_count > 0) {
        setSuccess(`Successfully marked attendance for ${response.data.created_count} students`);
        // Refresh student list to show updated attendance
        fetchClassStudents(selectedClass);
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some records failed: ${response.data.errors.length} errors`);
      }

    } catch (error) {
      setError('Failed to submit attendance');
      console.error('Error submitting attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(status => status === 'present').length;
    const absent = Object.values(attendanceData).filter(status => status === 'absent').length;
    
    return { total, present, absent };
  };

  const stats = getAttendanceStats();

  if (loading && assignedClasses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
        <p className="text-indigo-100">Mark attendance for your assigned classes</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Classes</h2>
            
            {assignedClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes assigned</p>
            ) : (
              <div className="space-y-3">
                {assignedClasses.map((classInfo, index) => (
                  <div
                    key={index}
                    onClick={() => fetchClassStudents(classInfo)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClass?.subject_code === classInfo.subject_code
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {classInfo.subject_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {classInfo.subject_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {classInfo.department_code} Semester {classInfo.semester} Section {classInfo.section}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {classInfo.total_students} students
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance Marking */}
        <div className="lg:col-span-2">
          {selectedClass ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedClass.subject_code} - {selectedClass.subject_name}
                  </h2>
                  <p className="text-gray-600">
                    {selectedClass.department_code} Semester {selectedClass.semester} Section {selectedClass.section}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => fetchClassStudents(selectedClass)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-green-600">Present</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <div className="text-sm text-red-600">Absent</div>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div
                    key={student.student_usn}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.student_usn}
                        </div>
                        {!student.is_registered && (
                          <div className="text-xs text-orange-600">
                            Not registered in system
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`attendance_${student.student_usn}`}
                          value="present"
                          checked={attendanceData[student.student_usn] === 'present'}
                          onChange={() => handleAttendanceChange(student.student_usn, 'present')}
                          className="mr-2 text-green-600"
                        />
                        <span className="text-sm text-green-600">Present</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`attendance_${student.student_usn}`}
                          value="absent"
                          checked={attendanceData[student.student_usn] === 'absent'}
                          onChange={() => handleAttendanceChange(student.student_usn, 'absent')}
                          className="mr-2 text-red-600"
                        />
                        <span className="text-sm text-red-600">Absent</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              {students.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={submitAttendance}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
              <p className="text-gray-500">Choose a class from the left panel to mark attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorAttendanceManager;