import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { 
  Menu, X, LogOut, Bell, Home, Users, Bus, MapPin, 
  CreditCard, AlertTriangle, BarChart3, Settings, UserCog,
  FileText, PlusCircle, ClipboardList, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';

export default function DashboardLayout({ 
  children, 
  userType, 
  userName,
  menuItems = [],
  notifications = [],
  showBackButton = true
}) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate(createPageUrl('Home'));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-amber-100 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-amber-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900">Mohammed 5 School Bus</h1>
                <p className="text-xs text-amber-600">{userType}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notif, idx) => (
                          <div key={idx} className={`p-4 border-b border-amber-50 ${!notif.read ? 'bg-amber-50/50' : ''}`}>
                            <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucune notification
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-amber-200">
              <div className="hidden sm:block text-right">
                <p className="font-medium text-gray-900 text-sm">{userName}</p>
                <p className="text-xs text-amber-600">{userType}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-amber-100
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          pt-20 lg:pt-0 overflow-y-auto
        `}>
          {userType === 'Espace Administrateur' ? (
            <AdminSidebar menuItems={menuItems} />
          ) : (
            <nav className="p-4 space-y-2">
              {menuItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={createPageUrl(item.path)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${item.active 
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-73px)]">
          {showBackButton && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="mb-4 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}