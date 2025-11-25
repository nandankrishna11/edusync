/**
 * Enhanced Timetable Page - Uses the new semester-based timetable system
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useApi } from '../hooks/useApi';

const EnhancedTimetablePage = () => {
    const { user, isStudent, isProfessor, isAdmin } = useAuth();
    const { apiCall } = useApi();
    const [activeTab, setActiveTab] = useState('view');
    const [timetableData, setTimetableData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Student-specific state
    const [studentTimetable, setStudentTimetable] = useState({});
    const [upcomingClasses, setUpcomingClasses] = useState([]);

    // Professor-specific state
    const [professorTimetable, setProfessorTimetable] = useState({});
    const [todaysClasses, setTodaysClasses] = useState([]);

    useEffect(() => {
        if (user) {
            if (isStudent()) {
                setActiveTab('student-view');
                fetchStudentTimetable();
            } else if (isProfessor()) {
                setActiveTab('professor-view');
                fetchProfessorTimetable();
            } else if (isAdmin()) {
                setActiveTab('admin-view');
                fetchAdminTimetable();
            }
        }
    }, [user]);

    const fetchStudentTimetable = async () => {
        setLoading(true);
        try {
            const response = await apiCall('/simple-timetable/student/my-timetable');
            setStudentTimetable(response.daily_schedule || {});
            
            const upcomingResponse = await apiCall('/simple-timetable/student/upcoming-classes?days=7');
            setUpcomingClasses(upcomingResponse.upcoming_classes || []);
        } catch (error) {
            console.error('Error fetching student timetable:', error);
            setError('Failed to load your timetable');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfessorTimetable = async () => {
        setLoading(true);
        try {
            const response = await apiCall('/simple-timetable/professor/my-timetable');
            setProfessorTimetable(response.daily_schedule || {});
            setTodaysClasses(response.todays_classes || []);
        } catch (error) {
            console.error('Error fetching professor timetable:', error);
            setError('Failed to load your timetable');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminTimetable = async () => {
        setLoading(true);
        try {
            // For admin, fetch CS department semester 3 as default
            const response = await apiCall('/simple-timetable/admin/department-timetable/CS?semester=3');
            setTimetableData(response);
        } catch (error) {
            console.error('Error fetching admin timetable:', error);
            setError('Failed to load timetable data');
        } finally {
            setLoading(false);
        }
    };

    // Student Timetable View
    const StudentTimetableView = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Timetable</h2>
                
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : Object.keys(studentTimetable).length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                        <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {['09:00', '10:00', '11:15', '12:15', '14:00', '15:00', '16:15'].map(time => (
                                    <tr key={time}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {time}
                                        </td>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                            const classEntry = studentTimetable[day]?.find(entry => entry.period_start === time);
                                            return (
                                                <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {classEntry ? (
                                                        <div className="bg-blue-100 text-blue-800 p-2 rounded text-xs">
                                                            <div className="font-medium">{classEntry.subject_code}</div>
                                                            <div>{classEntry.subject_name}</div>
                                                            <div>{classEntry.professor_name}</div>
                                                            {classEntry.room_number && <div>Room: {classEntry.room_number}</div>}
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
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No timetable available</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Professor Timetable View
    const ProfessorTimetableView = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Teaching Schedule</h2>
                
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : Object.keys(professorTimetable).length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                        <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {['09:00', '10:00', '11:15', '12:15', '14:00', '15:00', '16:15'].map(time => (
                                    <tr key={time}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {time}
                                        </td>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                            const classEntry = professorTimetable[day]?.find(entry => entry.period_start === time);
                                            return (
                                                <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {classEntry ? (
                                                        <div className="bg-green-100 text-green-800 p-2 rounded text-xs">
                                                            <div className="font-medium">{classEntry.subject_code}</div>
                                                            <div>{classEntry.subject_name}</div>
                                                            <div>{classEntry.department_code} {classEntry.semester} {classEntry.section}</div>
                                                            {classEntry.room_number && <div>Room: {classEntry.room_number}</div>}
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
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No classes assigned</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Admin Timetable View
    const AdminTimetableView = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Department Timetable</h2>
                
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : timetableData && timetableData.semester_sections?.length > 0 ? (
                    <div className="space-y-6">
                        {timetableData.semester_sections.map((semesterData, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                    <h4 className="font-medium text-gray-900">
                                        {timetableData.department_name} - Semester {semesterData.semester} - Section {semesterData.section}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Academic Year: {semesterData.academic_year} • {semesterData.entries.length} classes
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                    <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        {day}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {['09:00', '10:00', '11:15', '12:15', '14:00', '15:00', '16:15'].map(time => (
                                                <tr key={time}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {time}
                                                    </td>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                                        const classEntry = semesterData.entries.find(
                                                            entry => entry.day === day && entry.period_start === time
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
                        <p className="text-gray-500">No timetable data available</p>
                        <button 
                            onClick={fetchAdminTimetable}
                            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            Refresh
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isStudent() && 'My Timetable'}
                                {isProfessor() && 'Teaching Schedule'}
                                {isAdmin() && 'Timetable Overview'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {isStudent() && 'View your class schedule'}
                                {isProfessor() && 'Manage your teaching schedule'}
                                {isAdmin() && 'View department timetables'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Student View */}
                {isStudent() && <StudentTimetableView />}

                {/* Professor View */}
                {isProfessor() && <ProfessorTimetableView />}

                {/* Admin View */}
                {isAdmin() && <AdminTimetableView />}
            </div>
        </div>
    );
};

export default EnhancedTimetablePage;