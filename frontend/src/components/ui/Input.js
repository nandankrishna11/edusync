import React from 'react';

export const Input = ({ 
  label, 
  error, 
  helper,
  icon: Icon,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 ${Icon ? 'pl-10' : ''}
            bg-white border ${error ? 'border-red-300' : 'border-gray-300'}
            text-gray-900 text-sm rounded-xl
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 
            ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'} 
            focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
};

export const Select = ({ 
  label, 
  error, 
  helper, 
  options = [],
  children,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3
          bg-white border ${error ? 'border-red-300' : 'border-gray-300'}
          text-gray-900 text-sm rounded-xl
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'} focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          transition-all duration-200
          ${className}
        `}
        {...props}
      >
        {children || options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
};

export const Textarea = ({ 
  label, 
  error, 
  helper,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3
          bg-white border ${error ? 'border-red-300' : 'border-gray-300'}
          text-gray-900 text-sm rounded-xl
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'} focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          transition-all duration-200
          resize-vertical
          min-h-[120px]
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
};

export default Input;
