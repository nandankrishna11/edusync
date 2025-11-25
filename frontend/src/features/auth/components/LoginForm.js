import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../../../components/ui';
import Button from '../../../components/ui/Button';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    user_id: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials);
    } catch (error) {
      
      // More specific error messages
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message;
        
        if (status === 401) {
          setError('Invalid User ID or password. Please check your credentials.');
        } else if (status === 403) {
          setError('Account is deactivated. Please contact administrator.');
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(detail || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Classroom account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            <Input
              label="User ID"
              type="text"
              name="user_id"
              value={credentials.user_id}
              onChange={(e) => setCredentials({...credentials, user_id: e.target.value.toUpperCase()})}
              placeholder="Enter your ID (USN or Employee ID)"
              icon={UserIcon}
              helper="Students: Use USN (e.g., 1MS21CS001) • Professors: Use Employee ID (e.g., EMP001)"
              required
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              icon={LockIcon}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 transition-all" 
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Forgot password?
              </button>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Classroom Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;