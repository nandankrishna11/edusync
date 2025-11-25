import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'p-6',
  ...props 
}) => {
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl ${padding} shadow-sm transition-all duration-300 ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend = 'up'
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          {Icon && <Icon className={`w-6 h-6 ${iconColor}`} />}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
            {trend === 'up' ? '+' : ''}{change}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </Card>
  );
};

export default Card;
