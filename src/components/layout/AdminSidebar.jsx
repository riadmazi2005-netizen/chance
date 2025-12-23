import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSidebar({ menuItems = [], currentPath }) {
  const [expandedSections, setExpandedSections] = useState({
    gestion: true,
    operations: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const gestionItems = menuItems.filter(item => 
    ['AdminRegistrations', 'AdminStudents', 'AdminBuses', 'AdminRoutes', 'AdminDrivers', 'AdminSupervisors'].includes(item.path)
  );

  const operationsItems = menuItems.filter(item => 
    ['AdminPayments', 'AdminAccidents', 'AdminNotifications'].includes(item.path)
  );

  const otherItems = menuItems.filter(item => 
    ['AdminDashboard', 'AdminStats'].includes(item.path)
  );

  const renderMenuItem = (item) => (
    <Link
      key={item.path}
      to={createPageUrl(item.path)}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm
        ${item.active 
          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md' 
          : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}
      `}
    >
      {item.icon && <item.icon className="w-4 h-4" />}
      <span className="font-medium">{item.label}</span>
    </Link>
  );

  return (
    <nav className="p-4 space-y-6">
      {/* Main Items */}
      {otherItems.length > 0 && (
        <div className="space-y-1">
          {otherItems.map(renderMenuItem)}
        </div>
      )}

      {/* Gestion Section */}
      {gestionItems.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('gestion')}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-amber-600 transition-colors"
          >
            <span>Gestion</span>
            {expandedSections.gestion ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.gestion && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 mt-2 overflow-hidden"
              >
                {gestionItems.map(renderMenuItem)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Operations Section */}
      {operationsItems.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('operations')}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-amber-600 transition-colors"
          >
            <span>Opérations</span>
            {expandedSections.operations ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.operations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 mt-2 overflow-hidden"
              >
                {operationsItems.map(renderMenuItem)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </nav>
  );
}