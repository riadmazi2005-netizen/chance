import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, Bell, FileText, Loader2, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STORAGE_PREFIX = 'schoolbus_';

const getNotifications = (userId, userType) => {
  const data = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
  const notifications = data ? JSON.parse(data) : [];
  return notifications.filter(n => n.recipientId === userId && n.recipientType === userType);
};

const updateNotification = (id, updates) => {
  const data = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
  const notifications = data ? JSON.parse(data) : [];
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index] = { ...notifications[index], ...updates };
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  }
};

export default function TutorNotifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'tutor') {
      navigate(createPageUrl('TutorLogin'));
      return;
    }
    setCurrentUser(user);
    loadNotifications(user.id);
  }, []);

  const loadNotifications = (tutorId) => {
    try {
      const data = getNotifications(tutorId, 'tutor');
      setNotifications(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notifId) => {
    try {
      updateNotification(notifId, { read: true });
      setNotifications(notifications.map(n => 
        n.id === notifId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      delay: AlertTriangle,
      absence: Clock,
      validation: CheckCircle,
      payment: CreditCard,
      general: Bell
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      delay: 'text-orange-500 bg-orange-100',
      absence: 'text-red-500 bg-red-100',
      validation: 'text-green-500 bg-green-100',
      payment: 'text-blue-500 bg-blue-100',
      general: 'text-amber-500 bg-amber-100'
    };
    return colors[type] || 'text-amber-500 bg-amber-100';
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'TutorDashboard', icon: Users },
    { label: 'Mes Élèves', path: 'TutorStudents', icon: User },
    { label: 'Notifications', path: 'TutorNotifications', icon: Bell, active: true },
    { label: 'Mon Profil', path: 'TutorProfile', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      userType="Espace Tuteur"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={notifications}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            {notifications.filter(n => !n.read).length} non lues
          </Badge>
        </div>

        <Card className="border-amber-100 shadow-lg">
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-amber-50">
                {notifications.map((notif, idx) => {
                  const Icon = getNotificationIcon(notif.type);
                  const colorClass = getNotificationColor(notif.type);
                  
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 sm:p-6 hover:bg-amber-50/30 transition-colors ${!notif.read ? 'bg-amber-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                              <p className="text-gray-500 text-sm mt-1">{notif.message}</p>
                            </div>
                            {!notif.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notif.id)}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                              >
                                Marquer lu
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            {notif.created_date && format(new Date(notif.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Aucune notification</p>
                <p className="text-sm mt-1">Vous serez notifié des mises à jour importantes ici</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}