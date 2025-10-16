import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      console.log('Login attempt:', formData);
      setIsLoading(false);
      // TODO: Connect to backend API
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-start opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-end opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Main login card */}
      <div className="relative w-full max-w-md">
        <div 
          className="bg-glass-card bg-opacity-20 backdrop-blur-glass border border-glass-border rounded-glass p-8 shadow-glass"
          style={{
            background: 'rgba(26, 27, 47, 0.2)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-button-gradient rounded-glass mx-auto flex items-center justify-center shadow-button-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-dark-text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-dark-text-secondary">
              Sign in to your classroom account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-input-bg border border-dark-input-border rounded-glass 
                           text-dark-text-primary placeholder-dark-text-secondary
                           focus:outline-none focus:ring-2 focus:ring-gradient-start focus:border-transparent
                           transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-input-bg border border-dark-input-border rounded-glass 
                           text-dark-text-primary placeholder-dark-text-secondary
                           focus:outline-none focus:ring-2 focus:ring-gradient-start focus:border-transparent
                           transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-dark-text-secondary">
                <input 
                  type="checkbox" 
                  className="mr-2 rounded border-dark-input-border bg-dark-input-bg text-gradient-start focus:ring-gradient-start"
                />
                Remember me
              </label>
              <button type="button" className="text-gradient-start hover:text-gradient-end transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-button-gradient text-white py-3 px-6 rounded-glass font-semibold
                       shadow-button-glow hover:shadow-button-glow-hover
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-glass-border"></div>
            <span className="px-4 text-dark-text-secondary text-sm">or</span>
            <div className="flex-1 border-t border-glass-border"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3 border border-glass-border rounded-glass
                             bg-dark-input-bg hover:bg-opacity-30 text-dark-text-primary
                             transition-all duration-300 hover:border-dark-text-secondary">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-dark-text-secondary">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-gradient-start hover:text-gradient-end font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;