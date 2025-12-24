import React, { createContext, useContext, useState } from 'react';

// Contexte pour gérer l'état des onglets
const TabsContext = createContext();

// Composant principal Tabs
export function Tabs({ children, defaultValue, className = '', onValueChange }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`tabs-container ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Composant pour la liste des onglets
export function TabsList({ children, className = '' }) {
  return (
    <div className={`tabs-list flex border-b border-gray-200 ${className}`} role="tablist">
      {children}
    </div>
  );
}

// Composant pour un déclencheur d'onglet individuel
export function TabsTrigger({ children, value, className = '' }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`
        tabs-trigger px-4 py-2 font-medium transition-colors
        ${isActive 
          ? 'border-b-2 border-blue-500 text-blue-600' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Composant pour le contenu d'un onglet
export function TabsContent({ children, value, className = '' }) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return (
    <div 
      role="tabpanel"
      className={`tabs-content p-4 ${className}`}
    >
      {children}
    </div>
  );
}