/**
 * Timetable Management - Admin can create and upload timetables for each department and year
 */
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const TimetableManagement = () => {
  const { apiCall } = useApi();
  const [activeView, setActiveView] = useState('create');
  const [selectedDepartment, setSelectedDepartment] = useState('CS');
  const [selectedYear, setSelectedYear] = useState('2');
  const [selectedSemester, setSelectedSemester] = useState('3');
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [message, setMessage] = useState('');

  const departments = [
    { code: 'CS', name: 'Computer Science Engineering', color: 'bg-blue-100 text-blue-800' },
    { code: 'ME', name: 'Mechanical Engineering', color: 'bg-green-100 text-green-800' },
    { code: 'EC', name: 'Electronics & Communication', color: 'bg-purple-100 text-purple-800' },
    { code: 'CV', name: 'Civil Engineering', color: 'bg-orange-100 text-orange-800' },
    { code: 'AI', name: 'Artificial Intelligence & ML', color: 'bg-pink-100 text-pink-800' }
  ];

  const years = [
    { value: '1', label: '1st Year', semesters: [1, 2] },
    { value: '2', label: '2nd Year', semesters: [3, 4] },
    { value: '3', label: '3rd Year', semesters: [5, 6] },
    { value: '4', label: '4th Year', semesters: [7, 8] }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:15', end: '12:15' },
    { start: '12:15', end: '13:15' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:15', end: '17:15' }
  ];

  useEffect(() => {
    if (activeView === 'view') {
      fetchTimetable();
    }
  }, [selectedDepartment, selectedSemester, activeView]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/simple-timetable/admin/department-timetable/${selectedDepartment}?semester=${selectedSemester}`);
      setTimetables(response.semester_sections || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setMessage('Error fetching timetable data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setMessage('Please select a CSV file to upload');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Use fetch directly for FormData upload
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/timetable/admin/upload-csv?academic_year=2024-25`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();

      setMessage(`✓ Upload successful! Created ${result.created_count} entries. ${result.error_count} errors.`);
      setUploadFile(null);
      
      // Refresh timetable if viewing
      if (activeView === 'view') {
        fetchTimetable();
      }
    } catch (error) {
      console.error('Error uploading timetable:', error);
      setMessage('✗ Upload failed. Please check your CSV format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiCall('/simple-timetable/admin/csv-template');
      
      // Create CSV content from template
      const headers = response.required_columns.join(',');
      const sampleRows = response.sample_data.map(row => 
        response.required_columns.map(col => row[col] || '').join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${sampleRows}`;
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timetable_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage('✓ Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      setMessage('✗ Failed to download template');
    }
  };

  const getSemesterType = (semester) => {
    return semester % 2 === 1 ? 'Odd' : 'Even';
  };

  const getCurrentSemesterFromUSN = (usn) => {
    // Extract year from USN (e.g., 4KV23CS062 -> 23 -> 2023)
    const yearStr = usn.substring(3, 5);
    const joinedYear = 2000 + parseInt(yearStr);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Calculate semester based on years passed and current month
    let yearsPassed = currentYear - joinedYear;
    if (currentMonth >= 7) yearsPassed += 1; // Academic year starts in July
    
    const semester = Math.min(yearsPassed * 2, 8);
    return Math.max(semester, 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable Management</h2>
          <p className="text-gray-600 mt-1">Create and manage semester-specific timetables for all departments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('create')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Create Timetable
          </button>
          <button
            onClick={() => setActiveView('view')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'view'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            View Timetables
          </button>
        </div>
      </div>

      {/* Department and Year Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Department & Year</h3>
        
        {/* Department Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Department</label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {departments.map((dept) => (
              <button
                key={dept.code}
                onClick={() => setSelectedDepartment(dept.code)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedDepartment === dept.code
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${dept.color}`}>
                  {dept.code}
                </div>
                <p className="text-sm font-medium text-gray-900">{dept.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Year and Semester Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Academic Year</label>
            <div className="space-y-2">
              {years.map((year) => (
                <button
                  key={year.value}
                  onClick={() => {
                    setSelectedYear(year.value);
                    setSelectedSemester(year.semesters[0].toString());
                  }}
                  className={`w-full p-3 rounded-lg border text-left ${
                    selectedYear === year.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{year.label}</div>
                  <div className="text-sm text-gray-500">
                    Semesters: {year.semesters.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Semester</label>
            <div className="space-y-2">
              {years.find(y => y.value === selectedYear)?.semesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem.toString())}
                  className={`w-full p-3 rounded-lg border text-left ${
                    selectedSemester === sem.toString()
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Semester {sem}</div>
                  <div className="text-sm text-gray-500">
                    {getSemesterType(sem)} Semester
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Selection:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {departments.find(d => d.code === selectedDepartment)?.name}
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {years.find(y => y.value === selectedYear)?.label}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Semester {selectedSemester} ({getSemesterType(parseInt(selectedSemester))})
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Students with USN pattern 4KV{selectedYear === '1' ? '24' : selectedYear === '2' ? '23' : selectedYear === '3' ? '22' : '21'}{selectedDepartment}XXX will see this timetable
          </p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Create Timetable View */}
      {activeView === 'create' && (
        <TimetableCreator
          selectedDepartment={selectedDepartment}
          selectedSemester={selectedSemester}
          onTimetableCreated={() => {
            setMessage('✓ Timetable created successfully!');
            fetchTimetable(); // Always refresh the timetable data
            setActiveView('view'); // Switch to view tab to show the updated timetable
          }}
          onError={(error) => setMessage(`✗ ${error}`)}
        />
      )}

      {/* View Timetables */}
      {activeView === 'view' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Timetable for {selectedDepartment} - Semester {selectedSemester}
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : timetables.length > 0 ? (
            <div className="space-y-6">
              {timetables.map((semesterData, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-medium text-gray-900">
                      Semester {semesterData.semester} - Section {semesterData.section}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Academic Year: {semesterData.academic_year} • {semesterData.entries.length} classes
                    </p>
                  </div>

                  {/* Timetable Grid */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          {days.map(day => (
                            <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {timeSlots.map(slot => (
                          <tr key={`${slot.start}-${slot.end}`}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {slot.start} - {slot.end}
                            </td>
                            {days.map(day => {
                              const classEntry = semesterData.entries.find(
                                entry => entry.day === day && entry.period_start === slot.start
                              );
                              
                              return (
                                <td key={day} className="px-4 py-3 text-sm">
                                  {classEntry ? (
                                    <div className={`p-2 rounded text-xs ${
                                      classEntry.is_cancelled 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      <div className="font-medium">{classEntry.subject_code}</div>
                                      <div className="text-xs opacity-75">{classEntry.subject_name}</div>
                                      <div className="text-xs opacity-75">{classEntry.professor_name}</div>
                                      {classEntry.room_number && (
                                        <div className="text-xs opacity-75">Room: {classEntry.room_number}</div>
                                      )}
                                      {classEntry.is_cancelled && (
                                        <div className="text-xs font-medium text-red-600">CANCELLED</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-center">-</div>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No timetable found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No timetable has been created for {selectedDepartment} Semester {selectedSemester} yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveView('upload')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Upload Timetable
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Timetable Creator Component
const TimetableCreator = ({ selectedDepartment, selectedSemester, onTimetableCreated, onError }) => {
  const { apiCall } = useApi();
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    subject_code: '',
    day: 'Monday',
    period_start: '09:00',
    period_end: '10:00',
    room_number: '',
    professor_usn: '',
    section: 'A'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:15', end: '12:15' },
    { start: '12:15', end: '13:15' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:15', end: '17:15' }
  ];

  useEffect(() => {
    fetchSubjectsAndProfessors();
  }, [selectedDepartment]);

  const fetchSubjectsAndProfessors = async () => {
    try {
      // Fetch subjects and professors
      const [subjectsResponse, professorsResponse] = await Promise.all([
        apiCall(`/simple-timetable/admin/subjects?department_code=${selectedDepartment}`).catch(() => []),
        apiCall('/simple-timetable/admin/professors').catch(() => [])
      ]);

      setSubjects(subjectsResponse || []);
      setProfessors(professorsResponse || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const entryData = {
        department_code: selectedDepartment,
        semester: parseInt(selectedSemester),
        section: newEntry.section,
        academic_year: '2024-25',
        subject_code: newEntry.subject_code,
        day: newEntry.day,
        period_start: newEntry.period_start,
        period_end: newEntry.period_end,
        room_number: newEntry.room_number || null,
        professor_usn: newEntry.professor_usn
      };

      await apiCall('/simple-timetable/admin/create-entry', {
        method: 'POST',
        body: JSON.stringify(entryData)
      });

      // Add to local state
      setTimetableEntries([...timetableEntries, { ...entryData, id: Date.now() }]);
      
      // Reset form
      setNewEntry({
        subject_code: '',
        day: 'Monday',
        period_start: '09:00',
        period_end: '10:00',
        room_number: '',
        professor_usn: '',
        section: 'A'
      });
      
      setShowAddForm(false);
      onTimetableCreated();
    } catch (error) {
      console.error('Error adding entry:', error);
      onError('Failed to add timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await apiCall(`/timetable/admin/delete-entry/${entryId}`, {
        method: 'DELETE'
      });

      setTimetableEntries(timetableEntries.filter(entry => entry.id !== entryId));
      onTimetableCreated();
    } catch (error) {
      console.error('Error deleting entry:', error);
      onError('Failed to delete timetable entry');
    }
  };

  const createQuickTimetable = async () => {
    if (!subjects.length || !professors.length) {
      onError('Please ensure subjects and professors are available');
      return;
    }

    setLoading(true);
    try {
      const quickEntries = [];
      
      // Create a basic weekly schedule
      days.slice(0, 5).forEach((day, dayIndex) => { // Monday to Friday
        timeSlots.slice(0, 4).forEach((slot, slotIndex) => { // First 4 time slots
          const subjectIndex = (dayIndex * 4 + slotIndex) % subjects.length;
          const professorIndex = subjectIndex % professors.length;
          
          quickEntries.push({
            department_code: selectedDepartment,
            semester: parseInt(selectedSemester),
            section: 'A',
            academic_year: '2024-25',
            subject_code: subjects[subjectIndex].code,
            day: day,
            period_start: slot.start,
            period_end: slot.end,
            room_number: `${selectedDepartment}${101 + slotIndex}`,
            professor_usn: professors[professorIndex].usn
          });
        });
      });

      // Create entries in bulk
      for (const entry of quickEntries) {
        try {
          await apiCall('/simple-timetable/admin/create-entry', {
            method: 'POST',
            body: JSON.stringify(entry)
          });
          setTimetableEntries(prev => [...prev, { ...entry, id: Date.now() + Math.random() }]);
        } catch (error) {
          console.error('Error creating entry:', error);
        }
      }

      onTimetableCreated();
    } catch (error) {
      console.error('Error creating quick timetable:', error);
      onError('Failed to create quick timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Timetable Creation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-gray-600">Add Single Class</span>
          </button>

          <button
            onClick={createQuickTimetable}
            disabled={loading || !subjects.length || !professors.length}
            className="flex items-center justify-center space-x-2 p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{loading ? 'Creating...' : 'Generate Full Week'}</span>
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• <strong>Add Single Class:</strong> Create individual timetable entries</p>
          <p>• <strong>Generate Full Week:</strong> Automatically create a complete weekly schedule using available subjects and professors</p>
        </div>
      </div>

      {/* Current Entries */}
      {timetableEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Created Entries ({timetableEntries.length})
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {timetableEntries.map((entry, index) => (
              <div key={entry.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {entry.subject_code} - {entry.day} {entry.period_start}-{entry.period_end}
                  </div>
                  <div className="text-sm text-gray-600">
                    Section {entry.section} • Room {entry.room_number} • {entry.professor_usn}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Entry Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Timetable Entry</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={newEntry.subject_code}
                    onChange={(e) => setNewEntry({...newEntry, subject_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject, index) => (
                      <option key={`subject-${index}-${subject.code}`} value={subject.code}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={newEntry.section}
                    onChange={(e) => setNewEntry({...newEntry, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {['A', 'B', 'C', 'D'].map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={newEntry.day}
                    onChange={(e) => setNewEntry({...newEntry, day: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                  <select
                    value={newEntry.period_start}
                    onChange={(e) => {
                      const slot = timeSlots.find(s => s.start === e.target.value);
                      setNewEntry({
                        ...newEntry, 
                        period_start: slot.start,
                        period_end: slot.end
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot.start} value={slot.start}>
                        {slot.start} - {slot.end}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professor</label>
                  <select
                    value={newEntry.professor_usn}
                    onChange={(e) => setNewEntry({...newEntry, professor_usn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Professor</option>
                    {professors.map((professor, index) => (
                      <option key={`professor-${index}-${professor.usn}`} value={professor.usn}>
                        {professor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={newEntry.room_number}
                    onChange={(e) => setNewEntry({...newEntry, room_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., A101"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;