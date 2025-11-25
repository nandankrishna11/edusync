/**
 * Bulk Timetable Generator - Alternative to CSV upload
 */
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const BulkTimetableGenerator = () => {
  const { apiCall } = useApi();
  const [selectedDepartment, setSelectedDepartment] = useState('CS');
  const [selectedSemester, setSelectedSemester] = useState('3');
  const [selectedSection, setSelectedSection] = useState('A');
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedTimetable, setGeneratedTimetable] = useState([]);

  const departments = [
    { code: 'CS', name: 'Computer Science Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EC', name: 'Electronics & Communication' },
    { code: 'CV', name: 'Civil Engineering' },
    { code: 'AI', name: 'Artificial Intelligence & ML' }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { start: '09:00', end: '10:00', label: '9:00 - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 - 11:00 AM' },
    { start: '11:15', end: '12:15', label: '11:15 - 12:15 PM' },
    { start: '12:15', end: '13:15', label: '12:15 - 1:15 PM' },
    { start: '14:00', end: '15:00', label: '2:00 - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 - 4:00 PM' }
  ];

  useEffect(() => {
    fetchSubjectsAndProfessors();
  }, [selectedDepartment]);

  const fetchSubjectsAndProfessors = async () => {
    try {
      const [subjectsResponse, professorsResponse] = await Promise.all([
        apiCall(`/timetable/admin/subjects?department_code=${selectedDepartment}`).catch(() => []),
        apiCall('/timetable/admin/professors').catch(() => [])
      ]);

      setSubjects(subjectsResponse || []);
      setProfessors(professorsResponse || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateSmartTimetable = () => {
    if (!subjects.length || !professors.length) {
      setMessage('Please ensure subjects and professors are available');
      return;
    }

    const timetable = [];
    let subjectIndex = 0;
    let professorIndex = 0;

    // Generate a balanced weekly schedule
    days.forEach((day, dayIndex) => {
      // Vary the number of classes per day (3-5 classes)
      const classesPerDay = 3 + (dayIndex % 3);
      
      for (let i = 0; i < Math.min(classesPerDay, timeSlots.length); i++) {
        const subject = subjects[subjectIndex % subjects.length];
        const professor = professors[professorIndex % professors.length];
        const timeSlot = timeSlots[i];

        timetable.push({
          department_code: selectedDepartment,
          semester: parseInt(selectedSemester),
          section: selectedSection,
          academic_year: '2024-25',
          subject_code: subject.code,
          subject_name: subject.name,
          day: day,
          period_start: timeSlot.start,
          period_end: timeSlot.end,
          room_number: `${selectedDepartment}${101 + i}`,
          professor_usn: professor.usn,
          professor_name: professor.name
        });

        // Rotate subjects and professors for variety
        subjectIndex++;
        if (subjectIndex % 2 === 0) professorIndex++;
      }
    });

    setGeneratedTimetable(timetable);
    setMessage(`✓ Generated ${timetable.length} timetable entries`);
  };

  const saveTimetable = async () => {
    if (!generatedTimetable.length) {
      setMessage('Please generate a timetable first');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (const entry of generatedTimetable) {
        try {
          await apiCall('/timetable/admin/create-entry', {
            method: 'POST',
            body: JSON.stringify({
              department_code: entry.department_code,
              semester: entry.semester,
              section: entry.section,
              academic_year: entry.academic_year,
              subject_code: entry.subject_code,
              day: entry.day,
              period_start: entry.period_start,
              period_end: entry.period_end,
              room_number: entry.room_number,
              professor_usn: entry.professor_usn
            })
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${entry.day} ${entry.period_start}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        setMessage(`✓ Successfully saved ${successCount} entries${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
        setGeneratedTimetable([]);
      } else {
        setMessage(`✗ Failed to save timetable. Errors: ${errors.slice(0, 3).join(', ')}`);
      }
    } catch (error) {
      setMessage('✗ Error saving timetable');
    } finally {
      setLoading(false);
    }
  };

  const clearTimetable = () => {
    setGeneratedTimetable([]);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bulk Timetable Generator</h2>
        <p className="text-gray-600 mt-1">Generate complete timetables automatically using smart scheduling</p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timetable Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['A', 'B', 'C', 'D'].map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Available Resources */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Available Subjects</h4>
            <p className="text-blue-800 text-sm">
              {subjects.length} subjects loaded
              {subjects.length > 0 && (
                <span className="block mt-1">
                  {subjects.slice(0, 3).map(s => s.code).join(', ')}
                  {subjects.length > 3 && ` +${subjects.length - 3} more`}
                </span>
              )}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Available Professors</h4>
            <p className="text-green-800 text-sm">
              {professors.length} professors loaded
              {professors.length > 0 && (
                <span className="block mt-1">
                  {professors.slice(0, 2).map(p => p.name.split(' ')[0]).join(', ')}
                  {professors.length > 2 && ` +${professors.length - 2} more`}
                </span>
              )}
            </p>
          </div>
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

      {/* Generation Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Timetable</h3>
        
        <div className="flex space-x-4">
          <button
            onClick={generateSmartTimetable}
            disabled={!subjects.length || !professors.length}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate Smart Schedule</span>
          </button>

          {generatedTimetable.length > 0 && (
            <>
              <button
                onClick={saveTimetable}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{loading ? 'Saving...' : 'Save Timetable'}</span>
              </button>

              <button
                onClick={clearTimetable}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear</span>
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Smart Schedule:</strong> Automatically distributes subjects across the week with optimal professor allocation and room assignments.</p>
        </div>
      </div>

      {/* Generated Timetable Preview */}
      {generatedTimetable.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Timetable Preview ({generatedTimetable.length} entries)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Professor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generatedTimetable.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.day}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.period_start} - {entry.period_end}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{entry.subject_code}</div>
                      <div className="text-gray-500">{entry.subject_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.professor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.room_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkTimetableGenerator;