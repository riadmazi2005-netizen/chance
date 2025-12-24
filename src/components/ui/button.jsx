import React from 'react';

export const Button = React.forwardRef(({ 
  className = '',
  variant = 'default',
  size = 'default',
  children,
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    link: 'text-blue-600 underline-offset-4 hover:underline',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.default}
        ${className}
      `}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';