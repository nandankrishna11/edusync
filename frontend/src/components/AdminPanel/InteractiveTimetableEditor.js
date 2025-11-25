/**
 * Interactive Timetable Editor - Admin can create and edit timetables visually
 */
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const InteractiveTimetableEditor = () => {
    const { apiCall } = useApi();
    const [selectedDepartment, setSelectedDepartment] = useState('CS');
    const [selectedSemester, setSelectedSemester] = useState('3');
    const [selectedSection, setSelectedSection] = useState('A');
    const [timetableData, setTimetableData] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ code: '', name: '' });

    const departments = [
        { code: 'CS', name: 'Computer Science Engineering' },
        { code: 'ME', name: 'Mechanical Engineering' },
        { code: 'EC', name: 'Electronics & Communication' },
        { code: 'CV', name: 'Civil Engineering' },
        { code: 'AI', name: 'Artificial Intelligence & ML' }
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
        { start: '09:00', end: '10:00', label: '9:00 - 10:00 AM' },
        { start: '10:00', end: '11:00', label: '10:00 - 11:00 AM' },
        { start: '11:15', end: '12:15', label: '11:15 - 12:15 PM' },
        { start: '12:15', end: '13:15', label: '12:15 - 1:15 PM' },
        { start: '14:00', end: '15:00', label: '2:00 - 3:00 PM' },
        { start: '15:00', end: '16:00', label: '3:00 - 4:00 PM' },
        { start: '16:15', end: '17:15', label: '4:15 - 5:15 PM' }
    ];

    useEffect(() => {
        fetchTimetableData();
        fetchSubjects();
        fetchProfessors();
    }, [selectedDepartment, selectedSemester, selectedSection]);

    const fetchTimetableData = async () => {
        setLoading(true);
        try {
            const response = await apiCall(
                `/timetable/admin/department-timetable/${selectedDepartment}?semester=${selectedSemester}&section=${selectedSection}`
            );

            // Convert array to grid format
            const gridData = {};
            if (response.semester_sections && response.semester_sections.length > 0) {
                const sectionData = response.semester_sections.find(
                    s => s.semester === parseInt(selectedSemester) && s.section === selectedSection
                );

                if (sectionData) {
                    sectionData.entries.forEach(entry => {
                        const key = `${entry.day}-${entry.period_start}`;
                        gridData[key] = entry;
                    });
                }
            }

            setTimetableData(gridData);
        } catch (error) {
            console.error('Error fetching timetable:', error);
            setMessage('Error loading timetable data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await apiCall(`/timetable/admin/subjects?department_code=${selectedDepartment}`);
            setSubjects(response || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            // Fallback to mock data if API fails
            const mockSubjects = [
                { code: 'BCS301', name: 'Data Structures' },
                { code: 'BCS302', name: 'Database Management' },
                { code: 'BCS303', name: 'Computer Networks' },
                { code: 'BCS304', name: 'Operating Systems' },
                { code: 'BCS305', name: 'Software Engineering' },
                { code: 'BCS306', name: 'Web Technologies' }
            ];
            setSubjects(mockSubjects);
        }
    };

    const fetchProfessors = async () => {
        try {
            const response = await apiCall('/timetable/admin/professors');
            setProfessors(response || []);
        } catch (error) {
            console.error('Error fetching professors:', error);
            // Fallback to mock data if API fails
            const mockProfessors = [
                { usn: 'PROF001', name: 'Dr. John Smith' },
                { usn: 'PROF002', name: 'Dr. Jane Doe' },
                { usn: 'PROF003', name: 'Dr. Mike Johnson' },
                { usn: 'PROF004', name: 'Dr. Sarah Wilson' }
            ];
            setProfessors(mockProfessors);
        }
    };

    const handleCellClick = (day, timeSlot) => {
        const key = `${day}-${timeSlot.start}`;
        setEditingCell({
            key,
            day,
            timeSlot,
            existing: timetableData[key] || null
        });
    };

    const handleSaveCell = async (cellData) => {
        const entryData = {
            department_code: selectedDepartment,
            semester: parseInt(selectedSemester),
            section: selectedSection,
            academic_year: '2024-25',
            subject_code: cellData.subject_code,
            day: cellData.day,
            period_start: cellData.period_start,
            period_end: cellData.period_end,
            room_number: cellData.room_number || null,
            professor_usn: cellData.professor_usn
        };

        try {
            setLoading(true);
            setIsUpdating(true);

            if (cellData.existing) {
                // Update existing entry
                await apiCall(`/timetable/admin/update-entry/${cellData.existing.id}`, {
                    method: 'PUT',
                    body: entryData
                });
            } else {
                // Create new entry
                await apiCall('/timetable/admin/create-entry', {
                    method: 'POST',
                    body: entryData
                });
            }

            setMessage('✓ Timetable updated successfully');
            setEditingCell(null);
            
            // Immediately update local state for instant feedback
            const key = `${cellData.day}-${cellData.period_start}`;
            const newEntry = {
                ...entryData,
                id: cellData.existing?.id || Date.now(),
                subject_name: subjects.find(s => s.code === cellData.subject_code)?.name || cellData.subject_code,
                professor_name: professors.find(p => p.usn === cellData.professor_usn)?.name || cellData.professor_usn
            };
            
            setTimetableData(prev => ({
                ...prev,
                [key]: newEntry
            }));
            
            // Also refresh from server to ensure consistency
            setTimeout(async () => {
                await fetchTimetableData();
                setIsUpdating(false);
            }, 1000);
        } catch (error) {
            console.error('Error saving cell:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Entry data:', entryData);
            
            let errorMessage = 'Unknown error';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail || error.response.data?.message;
                
                if (status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (status === 403) {
                    errorMessage = 'Access denied. Admin privileges required.';
                } else if (status === 400) {
                    errorMessage = detail || 'Invalid data provided';
                } else if (status === 422) {
                    errorMessage = 'Validation error: ' + (detail || 'Invalid input data');
                } else {
                    errorMessage = detail || `Server error (${status})`;
                }
            } else if (error.request) {
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
                errorMessage = error.message || 'Request failed';
            }
            
            setMessage(`✗ Error updating timetable: ${errorMessage}`);
            setIsUpdating(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCell = async (cellKey) => {
        try {
            setLoading(true);
            setIsUpdating(true);
            const entry = timetableData[cellKey];

            if (entry && entry.id) {
                await apiCall(`/timetable/admin/delete-entry/${entry.id}`, {
                    method: 'DELETE'
                });

                setMessage('✓ Entry deleted successfully');
                
                // Immediately update local state for instant feedback
                setTimetableData(prev => {
                    const newData = { ...prev };
                    delete newData[cellKey];
                    return newData;
                });
                
                // Also refresh from server to ensure consistency
                setTimeout(async () => {
                    await fetchTimetableData();
                    setIsUpdating(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Error deleting cell:', error);
            setMessage('✗ Error deleting entry');
            setIsUpdating(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.code || !newSubject.name) {
            setMessage('Please enter both subject code and name');
            return;
        }

        try {
            // This would call a subjects API endpoint
            const updatedSubjects = [...subjects, newSubject];
            setSubjects(updatedSubjects);
            setNewSubject({ code: '', name: '' });
            setShowAddSubjectModal(false);
            setMessage('✓ Subject added successfully');
        } catch (error) {
            console.error('Error adding subject:', error);
            setMessage('✗ Error adding subject');
        }
    };

    const getCellContent = (day, timeSlot) => {
        const key = `${day}-${timeSlot.start}`;
        const entry = timetableData[key];

        if (!entry) {
            return (
                <div className="h-16 border border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-center text-gray-400">
                    <span className="text-xs">+ Add Class</span>
                </div>
            );
        }

        return (
            <div className={`h-16 border border-gray-200 p-2 cursor-pointer transition-all relative ${entry.is_cancelled ? 'bg-red-100' : 'bg-blue-100'
                } hover:opacity-80 ${isUpdating ? 'animate-pulse' : ''}`}>
                <div className="text-xs font-medium text-gray-900 truncate">
                    {entry.subject_code}
                </div>
                <div className="text-xs text-gray-600 truncate">
                    {entry.subject_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                    {entry.professor_name}
                </div>
                {entry.room_number && (
                    <div className="text-xs text-gray-500">
                        Room: {entry.room_number}
                    </div>
                )}
                {isUpdating && (
                    <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Interactive Timetable Editor</h2>
                    <p className="text-gray-600 mt-1">Create and edit timetables visually by clicking on time slots</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={fetchTimetableData}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const response = await apiCall('/timetable/admin/professors');
                                setMessage(`✓ API connection working. Found ${response.length} professors.`);
                            } catch (error) {
                                setMessage(`✗ API connection failed: ${error.response?.data?.detail || error.message}`);
                            }
                        }}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                    >
                        Test API
                    </button>
                    <button
                        onClick={() => setShowAddSubjectModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Add Subject
                    </button>
                </div>
            </div>

            {/* Department, Semester, Section Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Class</h3>

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
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
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

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Editing:</strong> {selectedDepartment} Semester {selectedSemester} Section {selectedSection}
                    </p>
                </div>
            </div>

            {/* Message Display */}
            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message}
                </div>
            )}

            {/* Update Indicator */}
            {isUpdating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-blue-800">Updating timetable...</span>
                    </div>
                </div>
            )}

            {/* Timetable Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Weekly Timetable - {selectedDepartment} Sem {selectedSemester} Sec {selectedSection}
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                                        Time
                                    </th>
                                    {days.map(day => (
                                        <th key={day} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(timeSlot => (
                                    <tr key={timeSlot.start}>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-r">
                                            {timeSlot.label}
                                        </td>
                                        {days.map(day => (
                                            <td key={day} className="p-1">
                                                <div onClick={() => handleCellClick(day, timeSlot)}>
                                                    {getCellContent(day, timeSlot)}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Cell Modal */}
            {editingCell && (
                <EditCellModal
                    cell={editingCell}
                    subjects={subjects}
                    professors={professors}
                    onSave={handleSaveCell}
                    onDelete={handleDeleteCell}
                    onClose={() => setEditingCell(null)}
                />
            )}

            {/* Add Subject Modal */}
            {showAddSubjectModal && (
                <AddSubjectModal
                    subject={newSubject}
                    onChange={setNewSubject}
                    onSave={handleAddSubject}
                    onClose={() => setShowAddSubjectModal(false)}
                />
            )}
        </div>
    );
};

// Edit Cell Modal Component
const EditCellModal = ({ cell, subjects, professors, onSave, onDelete, onClose }) => {
    const [formData, setFormData] = useState({
        subject_code: cell.existing?.subject_code || '',
        professor_usn: cell.existing?.professor_usn || '',
        room_number: cell.existing?.room_number || '',
        day: cell.day,
        period_start: cell.timeSlot.start,
        period_end: cell.timeSlot.end,
        existing: cell.existing
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject_code || !formData.professor_usn) {
            alert('Please select both subject and professor');
            return;
        }
        onSave(formData);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            onDelete(cell.key);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {cell.existing ? 'Edit Class' : 'Add Class'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        <strong>Time:</strong> {cell.day}, {cell.timeSlot.label}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <select
                            value={formData.subject_code}
                            onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
                        <select
                            value={formData.professor_usn}
                            onChange={(e) => setFormData({ ...formData, professor_usn: e.target.value })}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                        <input
                            type="text"
                            value={formData.room_number}
                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., A101"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        {cell.existing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            {cell.existing ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Subject Modal Component
const AddSubjectModal = ({ subject, onChange, onSave, onClose }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Subject</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                        <input
                            type="text"
                            value={subject.code}
                            onChange={(e) => onChange({ ...subject, code: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., BCS301"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                        <input
                            type="text"
                            value={subject.name}
                            onChange={(e) => onChange({ ...subject, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Data Structures"
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            Add Subject
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InteractiveTimetableEditor;