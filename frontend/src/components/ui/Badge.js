import React from 'react';

export const Badge = ({ 
  children, 
  variant = 'gray', 
  dot = false,
  className = '' 
}) => {
  const variants = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const dotColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    primary: 'bg-primary-500',
    gray: 'bg-gray-500',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-3 py-1 
      text-xs font-medium 
      rounded-full border 
      ${variants[variant]} 
      ${className}
    `}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const roleColors = {
    admin: 'bg-gradient-to-r from-purple-500 to-pink-500',
    professor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    student: 'bg-gradient-to-r from-green-500 to-emerald-500',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 ${roleColors[role] || roleColors.student} text-white text-xs font-semibold rounded-full shadow-sm capitalize`}>
      {role}
    </span>
  );
};

export default Badge;
