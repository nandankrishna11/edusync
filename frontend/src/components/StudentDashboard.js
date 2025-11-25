import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { StatCard, Card } from './ui/Card';
import { Badge } from './ui/Badge';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
          Track your classes and learning progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Subjects"
          value="6"
          icon={BookIcon}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatCard
          title="Attendance"
          value="87%"
          change="+2.5%"
          trend="up"
          icon={CheckIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        
        <StatCard
          title="Average Grade"
          value="A-"
          change="+0.3"
          trend="up"
          icon={ChartIcon}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        
        <StatCard
          title="Pending Tasks"
          value="3"
          icon={ClipboardIcon}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Today's Schedule */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
          <Badge variant="info">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Badge>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Data Structures</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Room 101
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Prof. Smith
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 mb-1">09:00 - 10:00</p>
              <Badge variant="success" dot>In Progress</Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Database Systems</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Room 203
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Prof. Johnson
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 mb-1">11:00 - 12:00</p>
              <Badge variant="info" dot>Next Up</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          onClick={() => navigate('/student/marks')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">My Marks</h3>
              <p className="text-sm text-gray-600 mt-1">View your grades & performance</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          onClick={() => navigate('/student/textbooks/chat')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">AI Textbook Chat</h3>
              <p className="text-sm text-gray-600 mt-1">Conversational AI assistant</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          onClick={() => navigate('/student/textbooks/my-subjects')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">My Subjects</h3>
              <p className="text-sm text-gray-600 mt-1">Manage subject preferences</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Attendance marked for Data Structures</p>
              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">New assignment posted in Database Systems</p>
              <p className="text-xs text-gray-500 mt-1">1 day ago</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Marks updated for Operating Systems</p>
              <p className="text-xs text-gray-500 mt-1">2 days ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;