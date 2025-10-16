import React, { useState, useEffect } from 'react';
import { getAllClasses, createClass, getNextClass } from '../services/api';

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassData, setNewClassData] = useState({
    title: '',
    instructor: '',
    students_count: 0,
    description: ''
  });
  const [nextClass, setNextClass] = useState(null);
  const [showCancelledBanner, setShowCancelledBanner] = useState(false);

  // Fetch classes from API
  useEffect(() => {
    fetchClasses();
    checkNextClass();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesData = await getAllClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNextClass = async () => {
    try {
      const nextClassData = await getNextClass('CS301'); // Default to CS301
      setNextClass(nextClassData);
      
      // Show banner if next class is cancelled
      if (nextClassData.has_next_class && nextClassData.next_class.is_cancelled) {
        setShowCancelledBanner(true);
      }
    } catch (error) {
      console.error('Error fetching next class:', error);
    }
  };

  const handleCreateClass = () => {
    setShowCreateModal(true);
  };

  const handleSubmitClass = async (e) => {
    e.preventDefault();
    setIsCreatingClass(true);
    
    try {
      await createClass(newClassData);
      setShowCreateModal(false);
      setNewClassData({
        title: '',
        instructor: '',
        students_count: 0,
        description: ''
      });
      // Refresh classes list
      await fetchClasses();
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClassData(prev => ({
      ...prev,
      [name]: name === 'students_count' ? parseInt(value) || 0 : value
    }));
  };

  const handleViewDetails = (classId) => {
    console.log('Viewing details for class:', classId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading classes...</div>
      </div>
    );
  }

  return (
    <div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancelled Class Banner */}
        {showCancelledBanner && nextClass?.next_class && (
          <div className="bg-app-danger bg-opacity-10 border border-app-danger rounded-app p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-app-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-app-danger">
                  Next Class Cancelled
                </h3>
                <div className="mt-1 text-sm text-app-danger">
                  <p>
                    <strong>{nextClass.next_class.subject}</strong> on {nextClass.next_class.day} at {nextClass.next_class.period_start}-{nextClass.next_class.period_end} has been cancelled.
                  </p>
                  {nextClass.next_class.cancel_reason && (
                    <p className="mt-1">
                      <strong>Reason:</strong> {nextClass.next_class.cancel_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-3 flex space-x-2">
                <a
                  href="/timetable"
                  className="bg-app-danger text-white px-3 py-1 rounded-app text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  View Timetable
                </a>
                <button
                  onClick={() => setShowCancelledBanner(false)}
                  className="text-app-danger hover:text-app-danger opacity-75 hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-app-text-primary mb-2">
                Welcome back, John! 👋
              </h1>
              <p className="text-app-text-secondary text-lg">
                Manage your classes and track your learning progress
              </p>
            </div>
            
            {/* Create New Class Button */}
            <button
              onClick={handleCreateClass}
              disabled={isCreatingClass}
              className="bg-light-gradient text-white px-6 py-3 rounded-app font-semibold
                       shadow-app-card hover:shadow-card-hover
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              {isCreatingClass ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Class</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-app-card rounded-app p-6 shadow-app-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-app-primary bg-opacity-10 rounded-app">
                <svg className="w-8 h-8 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-app-text-secondary">Total Classes</p>
                <p className="text-2xl font-bold text-app-text-primary">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-app-card rounded-app p-6 shadow-app-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-app-secondary bg-opacity-10 rounded-app">
                <svg className="w-8 h-8 text-app-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-app-text-secondary">Total Students</p>
                <p className="text-2xl font-bold text-app-text-primary">
                  {classes.reduce((sum, cls) => sum + cls.students_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-app-card rounded-app p-6 shadow-app-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-app-success bg-opacity-10 rounded-app">
                <svg className="w-8 h-8 text-app-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-app-text-secondary">Avg. Attendance</p>
                <p className="text-2xl font-bold text-app-text-primary">87%</p>
              </div>
            </div>
          </div>

          <div className="bg-app-card rounded-app p-6 shadow-app-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 bg-opacity-10 rounded-app">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-app-text-secondary">Active Sessions</p>
                <p className="text-2xl font-bold text-app-text-primary">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-app-text-primary">Your Classes</h2>
            <div className="flex items-center space-x-4">
              <select className="px-4 py-2 border border-app-border rounded-app text-app-text-secondary focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent">
                <option>All Subjects</option>
                <option>Computer Science</option>
                <option>Data Science</option>
                <option>Design</option>
                <option>Business</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-app-card rounded-app p-6 shadow-app-card hover:shadow-card-hover
                         transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              >
                {/* Class Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-app-text-primary mb-1 group-hover:text-app-primary transition-colors">
                        {classItem.title}
                      </h3>
                      <p className="text-app-text-secondary text-sm">
                        Subject Area
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-app-success rounded-full"></div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-app-text-secondary text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {classItem.instructor}
                    </div>
                    <div className="flex items-center text-app-text-secondary text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {classItem.students_count} students
                    </div>
                    <div className="flex items-center text-app-text-secondary text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2m-6 0V7" />
                      </svg>
                      {new Date(classItem.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Class Description */}
                <p className="text-app-text-secondary text-sm mb-6 leading-relaxed">
                  {classItem.description}
                </p>

                {/* Class Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-app-primary rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-app-secondary rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-app-success rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-xs text-app-text-secondary">+{classItem.students_count - 3} more</span>
                  </div>
                  
                  <button
                    onClick={() => handleViewDetails(classItem.id)}
                    className="bg-light-gradient text-white px-4 py-2 rounded-app text-sm font-medium
                             shadow-app-card hover:shadow-card-hover
                             transform hover:scale-[1.05] active:scale-[0.95]
                             transition-all duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-app-card rounded-app p-6 shadow-app-card">
          <h3 className="text-lg font-bold text-app-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 rounded-app hover:bg-app-bg transition-all duration-300 group">
              <div className="w-12 h-12 bg-app-primary bg-opacity-10 rounded-app flex items-center justify-center mb-3 group-hover:bg-opacity-20 transition-colors">
                <svg className="w-6 h-6 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-app-text-primary text-sm font-medium">Create Class</span>
            </button>
            
            <button className="flex flex-col items-center p-4 rounded-app hover:bg-app-bg transition-all duration-300 group">
              <div className="w-12 h-12 bg-app-secondary bg-opacity-10 rounded-app flex items-center justify-center mb-3 group-hover:bg-opacity-20 transition-colors">
                <svg className="w-6 h-6 text-app-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-app-text-primary text-sm font-medium">Search Classes</span>
            </button>
            
            <button className="flex flex-col items-center p-4 rounded-app hover:bg-app-bg transition-all duration-300 group">
              <div className="w-12 h-12 bg-app-success bg-opacity-10 rounded-app flex items-center justify-center mb-3 group-hover:bg-opacity-20 transition-colors">
                <svg className="w-6 h-6 text-app-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-app-text-primary text-sm font-medium">View Reports</span>
            </button>
            
            <button className="flex flex-col items-center p-4 rounded-app hover:bg-app-bg transition-all duration-300 group">
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-10 rounded-app flex items-center justify-center mb-3 group-hover:bg-opacity-20 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-app-text-primary text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded-app p-6 w-full max-w-md shadow-card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-app-text-primary">Create New Class</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-app-text-secondary hover:text-app-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  Class Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newClassData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                  placeholder="Enter class title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  Instructor Name
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={newClassData.instructor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                  placeholder="Enter instructor name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  Number of Students
                </label>
                <input
                  type="number"
                  name="students_count"
                  value={newClassData.students_count}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newClassData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
                  placeholder="Enter class description"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-app-border rounded-app text-app-text-secondary hover:text-app-text-primary hover:border-app-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="flex-1 bg-light-gradient text-white px-4 py-3 rounded-app font-semibold
                           shadow-app-card hover:shadow-card-hover
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center space-x-2"
                >
                  {isCreatingClass ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Class'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;