import React from 'react';

export const Badge = ({ className = '', variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-input',
  };
  
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};