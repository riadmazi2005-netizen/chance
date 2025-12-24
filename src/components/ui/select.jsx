import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Context pour gérer l'état du Select
const SelectContext = createContext();

// Composant principal Select
export function Select({ children, value, onValueChange, defaultValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleValueChange = (newValue, newLabel) => {
    setSelectedValue(newValue);
    setSelectedLabel(newLabel);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <SelectContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      selectedValue,
      selectedLabel,
      handleValueChange 
    }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// Composant SelectTrigger
export function SelectTrigger({ children, className = '', disabled = false }) {
  const { isOpen, setIsOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      className={`
        flex items-center justify-between w-full px-3 py-2 
        text-sm bg-white border border-gray-300 rounded-md
        hover:border-gray-400 focus:outline-none focus:ring-2 
        focus:ring-amber-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
      <svg
        className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

// Composant SelectValue
export function SelectValue({ placeholder = 'Sélectionner...' }) {
  const { selectedValue, selectedLabel } = useContext(SelectContext);
  
  // Afficher le label si disponible, sinon la valeur, sinon le placeholder
  const displayText = selectedLabel || selectedValue || placeholder;
  const isPlaceholder = !selectedValue;

  return (
    <span className={isPlaceholder ? 'text-gray-400' : 'text-gray-900'}>
      {displayText}
    </span>
  );
}

// Composant SelectContent
export function SelectContent({ children, className = '' }) {
  const { isOpen } = useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div 
      className={`
        absolute z-50 w-full mt-1 bg-white border border-gray-300 
        rounded-md shadow-lg max-h-60 overflow-auto
        ${className}
      `}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

// Composant SelectItem
export function SelectItem({ children, value, className = '' }) {
  const { selectedValue, handleValueChange } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  // Le label est le contenu textuel du children
  const label = typeof children === 'string' ? children : value;

  return (
    <div
      onClick={() => handleValueChange(value, label)}
      className={`
        px-3 py-2 text-sm cursor-pointer
        hover:bg-amber-50 transition-colors
        ${isSelected ? 'bg-amber-100 text-amber-900 font-medium' : 'text-gray-900'}
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        {children}
        {isSelected && (
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}