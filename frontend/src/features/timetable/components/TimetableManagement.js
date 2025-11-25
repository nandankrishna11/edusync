/**
 * Enhanced Timetable Management Component (Admin Interface)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { timetableService } from '../services/timetableService';

const TimetableManagement = () => {
  const { user, isProfessor, isAdmin } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'table', 'calendar'
  const [filterDay, setFilterDay] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    // Legacy fields
    class_id: '',
    subject: '',
    // New semester-based fields
    department_code: '',
    semester: 1,
    section: 'A',
    subject_code: '',
    // Common fields
    day: 'Monday',
    period_start: '09:00',
    period_end: '10:00',
    professor_usn: user?.user_id || ''
  });

  const [useNewSystem, setUseNewSystem] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:15', end: '12:15', label: '11:15 AM - 12:15 PM' },
    { start: '12:15', end: '13:15', label: '12:15 PM - 1:15 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
  ];

  const departments = [
    { code: 'CS', name: 'Computer Science' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EC', name: 'Electronics & Communication' },
    { code: 'CV', name: 'Civil Engineering' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'IT', name: 'Information Technology' },
  ];

  const commonSubjects = {
    CS: ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
    ME: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing', 'Heat Transfer', 'Mechanics'],
    EC: ['Digital Electronics', 'Analog Circuits', 'Communication Systems', 'Microprocessors', 'Signal Processing', 'VLSI'],
    CV: ['Structural Analysis', 'Concrete Technology', 'Surveying', 'Geotechnical Engineering', 'Transportation', 'Hydraulics'],
    EE: ['Power Systems', 'Control Systems', 'Electrical Machines', 'Power Electronics', 'Circuit Analysis', 'Electromagnetics'],
    IT: ['Web Development', 'Mobile Computing', 'Cloud Computing', 'Cybersecurity', 'Data Analytics', 'AI/ML']
  };

  useEffect(() => {
    fetchTimetable();
    fetchProfessors();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await timetableService.getTimetable();
      setTimetable(data);
    } catch (error) {
      setError('Failed to fetch timetable');
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      // Mock professor data - in real app, fetch from API
      const mockProfessors = [
        { usn: 'PROF001', name: 'Dr. John Smith', department: 'CS', specialization: 'Data Structures, Algorithms' },
        { usn: 'PROF002', name: 'Dr. Jane Doe', department: 'CS', specialization: 'Database Systems, Software Engineering' },
        { usn: 'PROF003', name: 'Dr. Mike Johnson', department: 'ME', specialization: 'Thermodynamics, Fluid Mechanics' },
        { usn: 'PROF004', name: 'Dr. Sarah Wilson', department: 'EC', specialization: 'Digital Electronics, Communication' },
        { usn: 'PROF005', name: 'Dr. David Brown', department: 'CV', specialization: 'Structural Analysis, Concrete Tech' },
        { usn: 'PROF006', name: 'Dr. Lisa Garcia', department: 'EE', specialization: 'Power Systems, Control Systems' },
      ];
      setProfessors(mockProfessors);
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await timetableService.createTimetableEntry(formData);
      setShowCreateModal(false);
      resetForm();
      setSuccess('Class created successfully!');
      fetchTimetable();
    } catch (error) {
      setError('Failed to create timetable entry: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await timetableService.updateTimetableEntry(selectedEntry.id, formData);
      setShowEditModal(false);
      setSelectedEntry(null);
      resetForm();
      setSuccess('Class updated successfully!');
      fetchTimetable();
    } catch (error) {
      setError('Failed to update timetable entry: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        setError('');
        await timetableService.deleteTimetableEntry(id);
        setSuccess('Class deleted successfully!');
        fetchTimetable();
      } catch (error) {
        setError('Failed to delete timetable entry: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      // Legacy fields
      class_id: '',
      subject: '',
      // New semester-based fields
      department_code: '',
      semester: 1,
      section: 'A',
      subject_code: '',
      // Common fields
      day: 'Monday',
      period_start: '09:00',
      period_end: '10:00',
      professor_usn: user?.user_id || ''
    });
    setUseNewSystem(false);
  };

  // Filter and search functions
  const getFilteredTimetable = () => {
    return timetable.filter(entry => {
      const matchesDay = !filterDay || entry.day === filterDay;
      const matchesDepartment = !filterDepartment || entry.department_code === filterDepartment;
      const matchesSearch = !searchTerm || 
        (entry.subject && entry.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.subject_code && entry.subject_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.professor_usn && entry.professor_usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.class_id && entry.class_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesDay && matchesDepartment && matchesSearch;
    });
  };

  // Get professor suggestions based on department
  const getProfessorSuggestions = (departmentCode) => {
    return professors.filter(prof => !departmentCode || prof.department === departmentCode);
  };

  // Generate timetable grid for table view
  const generateTimetableGrid = () => {
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period.start] = null;
      });
    });

    getFilteredTimetable().forEach(entry => {
      if (grid[entry.day] && grid[entry.day].hasOwnProperty(entry.period_start)) {
        grid[entry.day][entry.period_start] = entry;
      }
    });

    return grid;
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({
      // Legacy fields
      class_id: entry.class_id || '',
      subject: entry.subject || '',
      // New semester-based fields
      department_code: entry.department_code || '',
      semester: entry.semester || 1,
      section: entry.section || 'A',
      subject_code: entry.subject_code || '',
      // Common fields
      day: entry.day,
      period_start: entry.period_start,
      period_end: entry.period_end,
      professor_usn: entry.professor_usn
    });
    setUseNewSystem(!!entry.department_code);
    setShowEditModal(true);
  };

  const getStatusBadge = (entry) => {
    if (entry.is_cancelled) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  if (!isProfessor() && !isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage timetables.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-2">Timetable Management</h1>
            <p className="text-indigo-100">Create and manage class schedules across departments</p>
            <div className="flex items-center mt-2 space-x-4 text-sm">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {timetable.filter(t => !t.is_cancelled).length} Active Classes
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {timetable.filter(t => t.is_cancelled).length} Cancelled
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Class
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.code} value={dept.code}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {viewMode === 'list' ? (
          /* List View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject & Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredTimetable().map((entry) => {
                  const professor = professors.find(p => p.usn === entry.professor_usn);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${entry.is_cancelled ? 'bg-red-400' : 'bg-green-400'}`}></div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {entry.subject || entry.subject_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.class_id ? `Class: ${entry.class_id}` : 
                               `${entry.department_code} - Semester ${entry.semester} (${entry.section})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{entry.day}</div>
                            <div className="text-sm text-gray-500">{entry.period_start} - {entry.period_end}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-indigo-600">
                              {professor ? professor.name.split(' ').map(n => n[0]).join('') : entry.professor_usn.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {professor ? professor.name : entry.professor_usn}
                            </div>
                            {professor && (
                              <div className="text-xs text-gray-500">{professor.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(entry)}
                        {entry.is_cancelled && entry.cancel_reason && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={entry.cancel_reason}>
                            {entry.cancel_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(isAdmin() || entry.professor_usn === user?.user_id) ? (
                            <>
                              <button
                                onClick={() => openEditModal(entry)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {getFilteredTimetable().length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new class.</p>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
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
                        const entry = grid[day][period.start];
                        return (
                          <td key={day} className="border border-gray-300 p-2 h-20 align-top">
                            {entry ? (
                              <div className={`p-2 rounded-lg text-xs h-full ${
                                entry.is_cancelled 
                                  ? 'bg-red-100 border-l-4 border-red-400' 
                                  : 'bg-blue-100 border-l-4 border-blue-400'
                              }`}>
                                <div className="font-semibold text-gray-900 truncate">
                                  {entry.subject || entry.subject_code}
                                </div>
                                <div className="text-gray-600 truncate">
                                  {entry.class_id || `${entry.department_code}${entry.semester}${entry.section}`}
                                </div>
                                <div className="text-gray-500 truncate">
                                  {professors.find(p => p.usn === entry.professor_usn)?.name || entry.professor_usn}
                                </div>
                                <div className="flex justify-end mt-1 space-x-1">
                                  {(isAdmin() || entry.professor_usn === user?.user_id) && (
                                    <>
                                      <button
                                        onClick={() => openEditModal(entry)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Edit"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
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
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add New Class</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                {/* System Toggle */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Choose System Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="system"
                        checked={!useNewSystem}
                        onChange={() => setUseNewSystem(false)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium">Legacy (Class ID)</span>
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="system"
                        checked={useNewSystem}
                        onChange={() => setUseNewSystem(true)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium">Semester System</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Legacy System Fields */}
                {!useNewSystem && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
                      <input
                        type="text"
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        className="form-input"
                        required={!useNewSystem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="form-input"
                        required={!useNewSystem}
                      />
                    </div>
                  </>
                )}

                {/* New Semester System Fields */}
                {useNewSystem && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          value={formData.department_code}
                          onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                          className="form-input"
                          required={useNewSystem}
                        >
                          <option value="">Select</option>
                          <option value="CS">Computer Science</option>
                          <option value="ME">Mechanical</option>
                          <option value="EC">Electronics</option>
                          <option value="CV">Civil</option>
                          <option value="EE">Electrical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                          className="form-input"
                          required={useNewSystem}
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
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          className="form-input"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                      <input
                        type="text"
                        value={formData.subject_code}
                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                        className="form-input"
                        placeholder="e.g., BCS801"
                        required={useNewSystem}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="form-input"
                    required
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
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="form-input"
                      required
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
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="form-input"
                      required
                    >
                      {periods.map(period => (
                        <option key={period.end} value={period.end}>{period.end}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {isAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professor USN</label>
                    <input
                      type="text"
                      value={formData.professor_usn}
                      onChange={(e) => setFormData({ ...formData, professor_usn: e.target.value.toUpperCase() })}
                      className="form-input"
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Class</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                {/* System Display */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    System: {useNewSystem ? 'Semester System' : 'Legacy (Class ID)'}
                  </p>
                </div>

                {/* Legacy System Fields */}
                {!useNewSystem && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
                      <input
                        type="text"
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        className="form-input"
                        required={!useNewSystem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="form-input"
                        required={!useNewSystem}
                      />
                    </div>
                  </>
                )}

                {/* New Semester System Fields */}
                {useNewSystem && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          value={formData.department_code}
                          onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                          className="form-input"
                          required={useNewSystem}
                        >
                          <option value="">Select</option>
                          <option value="CS">Computer Science</option>
                          <option value="ME">Mechanical</option>
                          <option value="EC">Electronics</option>
                          <option value="CV">Civil</option>
                          <option value="EE">Electrical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                          className="form-input"
                          required={useNewSystem}
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
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          className="form-input"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                      <input
                        type="text"
                        value={formData.subject_code}
                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                        className="form-input"
                        placeholder="e.g., BCS801"
                        required={useNewSystem}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="form-input"
                    required
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
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="form-input"
                      required
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
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="form-input"
                      required
                    >
                      {periods.map(period => (
                        <option key={period.end} value={period.end}>{period.end}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {isAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professor USN</label>
                    <input
                      type="text"
                      value={formData.professor_usn}
                      onChange={(e) => setFormData({ ...formData, professor_usn: e.target.value.toUpperCase() })}
                      className="form-input"
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEntry(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;