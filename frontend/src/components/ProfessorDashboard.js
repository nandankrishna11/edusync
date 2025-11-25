import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { StatCard, Card } from './ui/Card';
import { Badge } from './ui/Badge';
import Button from './ui/Button';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const BookIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ClipboardIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your classes and student progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value="120"
          change="+5"
          trend="up"
          icon={UsersIcon}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatCard
          title="Subjects Teaching"
          value="3"
          icon={BookIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        
        <StatCard
          title="Avg Attendance"
          value="85%"
          change="+3%"
          trend="up"
          icon={CheckIcon}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        
        <StatCard
          title="Pending Reviews"
          value="8"
          icon={ClipboardIcon}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Today's Classes */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Today's Classes</h2>
          <Badge variant="info">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Badge>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-primary-50 to-secondary-50 border-l-4 border-primary-500 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex-1 mb-3 md:mb-0">
              <h3 className="font-semibold text-gray-900 mb-2">Data Structures - CS 3rd Sem</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  09:00 - 10:00
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Room 101
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  45 students
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>In Progress</Badge>
              <Button variant="primary" size="sm">
                Mark Attendance
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex-1 mb-3 md:mb-0">
              <h3 className="font-semibold text-gray-900 mb-2">Database Systems - CS 5th Sem</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  11:00 - 12:00
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Room 203
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  38 students
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" dot>Next Up</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/professor/attendance')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Mark Attendance</p>
                  <p className="text-sm text-gray-600">Record student attendance</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/timetable')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">View Timetable</p>
                  <p className="text-sm text-gray-600">Manage your class schedule</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/marks/entry')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Enter Marks</p>
                  <p className="text-sm text-gray-600">Record student marks and grades</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/marks/performance')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Student Performance</p>
                  <p className="text-sm text-gray-600">View individual student progress</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/notifications')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Notifications</p>
                  <p className="text-sm text-gray-600">Send announcements to students</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/analytics')}
              className="w-full group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">View performance insights</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/professor/textbooks/library')}
              className="w-full group text-left p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Textbook Library</p>
                  <p className="text-sm text-gray-600">Upload & manage course textbooks</p>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Attendance marked for CS 3rd Sem</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Marks entered for Database Systems quiz</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">New assignment created</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Class Performance Overview */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Class Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
            <div className="text-4xl font-bold text-blue-600 mb-2">85%</div>
            <p className="text-sm font-medium text-gray-700">Average Attendance</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
            <div className="text-4xl font-bold text-green-600 mb-2">78%</div>
            <p className="text-sm font-medium text-gray-700">Average Score</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
            <div className="text-4xl font-bold text-purple-600 mb-2">92%</div>
            <p className="text-sm font-medium text-gray-700">Assignment Completion</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfessorDashboard;