import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    success: 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md hover:shadow-lg',
    danger: 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md hover:shadow-lg',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-all duration-200
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
};

export default Button;
