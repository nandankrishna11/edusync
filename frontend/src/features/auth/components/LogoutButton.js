/**
 * Logout Button Component
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LogoutButton = ({ className = '', showText = true }) => {
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl ${className}`}
    >
      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </div>
      {showText && (
        <span className={`font-medium ${loading ? 'opacity-50' : ''}`}>
          {loading ? 'Logging out...' : 'Logout'}
        </span>
      )}
      {loading && (
        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin ml-auto"></div>
      )}
    </button>
  );
};

export default LogoutButton;