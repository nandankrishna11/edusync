import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(formData);
      console.log('Register response:', response);
      // TODO: Handle successful registration (redirect, store token, etc.)
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg">
      <div className="bg-app-card p-8 rounded-app shadow-app-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-app-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-app-text-secondary">
            Join the classroom platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-app-border rounded-app focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent"
              placeholder="Create a password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-app-primary hover:bg-app-secondary text-white py-3 rounded-app font-medium transition-colors"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-app-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-app-primary hover:text-app-secondary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;