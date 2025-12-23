import React from 'react';

export const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleSelect = (newValue) => {
    onValueChange(newValue);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child?.type?.displayName === 'SelectTrigger') {
          return React.cloneElement(child, { 
            onClick: () => setIsOpen(!isOpen),
            isOpen 
          });
        }
        if (child?.type?.displayName === 'SelectContent' && isOpen) {
          return React.cloneElement(child, { 
            onSelect: handleSelect,
            onClose: () => setIsOpen(false)
          });
        }
        return null;
      })}
    </div>
  );
};

export const SelectTrigger = React.forwardRef(({ className = '', children, onClick, ...props }, ref) => {
  return (
    <button
      type="button"
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder, children }) => (
  <span>{children || placeholder}</span>
);

export const SelectContent = ({ className = '', children, onSelect, onClose }) => {
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.select-content')) return;
      onClose?.();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  return (
    <div className={`select-content absolute z-50 mt-1 w-full bg-white rounded-md border shadow-md overflow-hidden ${className}`}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { onSelect })
      )}
    </div>
  );
};
SelectContent.displayName = 'SelectContent';

export const SelectItem = ({ value, children, onSelect }) => (
  <div
    className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
    onClick={() => onSelect?.(value)}
  >
    {children}
  </div>
);