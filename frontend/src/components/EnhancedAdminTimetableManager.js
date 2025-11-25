import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { timetableService } from '../features/timetable/services/timetableService';

const EnhancedAdminTimetableManager = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('CS');
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [selectedSection, setSelectedSection] = useState('A');
  const [timetableData, setTimetableData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [formData, setFormData] = useState({
    department_code: 'CS',
    semester: 5,
    section: 'A',
    subject_code: '',
    day: 'Monday',
    period_start: '09:00',
    period_end: '10:00',
    professor_usn: 'PROF001'
  });

  const departments = [
    { code: 'CS', name: 'Computer Science' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EC', name: 'Electronics & Communication' }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const periods = [
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
    { start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' }
  ];

  useEffect(() => {
    if (isAdmin()) {
      fetchSemesterTimetable();
    }
  }, [selectedDepartment, selectedSemester, selectedSection]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchSemesterTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await timetableService.getAdminSemesterTimetable(
        selectedDepartment, 
        selectedSemester, 
        selectedSection
      );
      setTimetableData(data);
    } catch (error) {
      setError('Failed to fetch timetable: ' + (error.response?.data?.detail || error.message));
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    
    if (!formData.subject_code.trim()) {
      setError('Subject code is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const timetableData = {
        department_code: formData.department_code,
        semester: parseInt(formData.semester),
        section: formData.section,
        subject_code: formData.subject_code.toUpperCase(),
        day: formData.day,
        period_start: formData.period_start,
        period_end: formData.period_end,
        professor_usn: formData.professor_usn
      };

      await timetableService.createAdminTimetableEntry(timetableData);
      
      setSuccess('Timetable entry created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchSemesterTimetable();
    } catch (error) {
      setError('Failed to create timetable entry: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await timetableService.deleteAdminTimetableEntry(id);
      setSuccess('Timetable entry deleted successfully');
      fetchSemesterTimetable();
    } catch (error) {
      setError('Failed to delete timetable entry: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      department_code: selectedDepartment,
      semester: selectedSemester,
      section: selectedSection,
      subject_code: '',
      day: 'Monday',
      period_start: '09:00',
      period_end: '10:00',
      professor_usn: 'PROF001'
    });
  };

  const generateTimetableGrid = () => {
    if (!timetableData?.daily_schedule) return {};
    
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period.start] = null;
      });
    });

    // Fill grid with timetable data
    Object.entries(timetableData.daily_schedule).forEach(([day, classes]) => {
      classes.forEach(classItem => {
        if (grid[day] && grid[day].hasOwnProperty(classItem.period_start)) {
          grid[day][classItem.period_start] = classItem;
        }
      });
    });

    return grid;
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage timetables.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Enhanced Timetable Management</h1>
            <p className="text-indigo-100">Manage class schedules by department and semester</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                ...formData,
                department_code: selectedDepartment,
                semester: selectedSemester,
                section: selectedSection
              });
              setShowCreateModal(true);
            }}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Class
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {departments.map(dept => (
                  <option key={dept.code} value={dept.code}>{dept.code} - {dept.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {['A', 'B'].map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>
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

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      ) : !timetableData || Object.keys(timetableData.daily_schedule || {}).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Entries</h3>
          <p className="text-gray-500 mb-4">
            No timetable found for {selectedDepartment} Semester {selectedSemester} Section {selectedSection}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {timetableData.department_name} - Semester {timetableData.semester} - Section {timetableData.section}
            </h2>
            <p className="text-gray-600">Total classes: {timetableData.total_classes}</p>
          </div>

          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 bg-gray-50 text-left text-sm font-medium text-gray-700">
                        Time
                      </th>
                      {days.map(day => (
                        <th key={day} className="border border-gray-300 px-4 py-2 bg-gray-50 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period.start}>
                        <td className="border border-gray-300 px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap">
                          {period.label}
                        </td>
                        {days.map(day => {
                          const grid = generateTimetableGrid();
                          const entry = grid[day]?.[period.start];
                          return (
                            <td key={day} className="border border-gray-300 p-2 h-20 align-top">
                              {entry ? (
                                <div className={`p-2 rounded-lg text-xs h-full ${
                                  entry.is_cancelled 
                                    ? 'bg-red-100 border-l-4 border-red-400' 
                                    : 'bg-blue-100 border-l-4 border-blue-400'
                                }`}>
                                  <div className="font-semibold text-gray-900 truncate">
                                    {entry.subject_code}
                                  </div>
                                  <div className="text-gray-600 truncate text-xs">
                                    {entry.subject_name}
                                  </div>
                                  <div className="text-gray-500 truncate text-xs">
                                    {entry.professor_name}
                                  </div>
                                  <div className="flex justify-end mt-1">
                                    <button
                                      onClick={() => handleDeleteTimetable(entry.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                  <button
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        day: day,
                                        period_start: period.start,
                                        period_end: period.end
                                      }));
                                      setShowCreateModal(true);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded p-1 w-full h-full flex items-center justify-center"
                                  >
                                    + Add Class
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(timetableData.daily_schedule).map(([day, classes]) =>
                    classes.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {entry.subject_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{day}</div>
                          <div className="text-sm text-gray-500">{entry.period_start} - {entry.period_end}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{entry.professor_name}</div>
                          <div className="text-sm text-gray-500">{entry.professor_usn}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.is_cancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {entry.is_cancelled ? 'Cancelled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteTimetable(entry.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Class</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTimetable} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department_code}
                    onChange={(e) => setFormData({...formData, department_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {departments.map(dept => (
                      <option key={dept.code} value={dept.code}>{dept.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {['A', 'B'].map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={formData.subject_code}
                  onChange={(e) => setFormData({...formData, subject_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., BCS501"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({...formData, day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <select
                    value={formData.period_start}
                    onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {periods.map(period => (
                      <option key={period.start} value={period.start}>{period.start}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <select
                    value={formData.period_end}
                    onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {periods.map(period => (
                      <option key={period.end} value={period.end}>{period.end}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor USN</label>
                <input
                  type="text"
                  value={formData.professor_usn}
                  onChange={(e) => setFormData({...formData, professor_usn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., PROF001"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminTimetableManager;