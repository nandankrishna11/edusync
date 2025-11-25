/**
 * Custom Toast Notification Component
 * Branded notifications with KVG theme
 */
import { useEffect } from 'react';
import collegeConfig from '../../config/collegeConfig';

const Toast = ({ type = 'info', message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      icon: 'text-green-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      icon: 'text-red-600',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      icon: 'text-yellow-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      icon: 'text-blue-600',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const config = types[type];

  return (
    <div className={`fixed top-4 right-4 z-50 animate-slide-in-right max-w-md`}>
      <div className={`${config.bg} border-l-4 ${config.border} rounded-xl shadow-2xl p-4`}>
        <div className="flex items-start space-x-3">
          {/* Logo */}
          <img 
            src={collegeConfig.images.logo} 
            alt="KVG" 
            className="w-8 h-8 flex-shrink-0"
          />
          
          {/* Icon */}
          <svg className={`w-6 h-6 ${config.icon} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.iconPath} />
          </svg>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            <p className="text-xs text-gray-600 mt-1">{collegeConfig.appName}</p>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
