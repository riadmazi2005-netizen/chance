import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { adminApi } from  '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, CheckCircle, DollarSign, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [raiseRequests, setRaiseRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'admin') {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifsData, raiseData, driversData, supervisorsData] = await Promise.all([
        adminApi.entities.Notification.filter({ recipientType: 'admin' }),
        adminApi.entities.RaiseRequest.filter({ status: 'pending' }),
        adminApi.entities.Driver.list(),
        adminApi.entities.Supervisor.list()
      ]);
      
      const raiseWithDetails = raiseData.map(r => {
        if (r.requesterType === 'driver') {
          const driver = driversData.find(d => d.id === r.requesterId);
          return { ...r, requesterName: driver ? `${driver.firstName} ${driver.lastName}` : '-' };
        } else {
          const supervisor = supervisorsData.find(s => s.id === r.requesterId);
          return { ...r, requesterName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '-' };
        }
      });
      
      setNotifications(notifsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setRaiseRequests(raiseWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await adminApi.entities.Notification.update(notifId, { read: true });
      setNotifications(notifications.map(n => 
        n.id === notifId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleRaiseRequest = async (request, approved) => {
    try {
      await adminApi.entities.RaiseRequest.update(request.id, {
        status: approved ? 'approved' : 'rejected'
      });

      // Notify requester
      await adminApi.entities.Notification.create({
        recipientId: request.requesterId,
        recipientType: request.requesterType,
        type: 'general',
        title: approved ? 'Demande d\'augmentation approuvée' : 'Demande d\'augmentation refusée',
        message: approved 
          ? 'Votre demande d\'augmentation a été approuvée. Contactez l\'administration pour plus de détails.'
          : 'Votre demande d\'augmentation a été refusée.',
        senderId: 'admin',
        senderType: 'admin'
      });

      loadData();
    } catch (error) {
      console.error('Error handling raise request:', error);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog },
    { label: 'Responsables', path: 'AdminSupervisors', icon: UserCog },
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell, active: true },
    { label: 'Statistiques', path: 'AdminStats', icon: BarChart3 },
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
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={notifications}
    >
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications & Demandes</h1>

        <Tabs defaultValue="notifications">
          <TabsList className="bg-amber-100">
            <TabsTrigger value="notifications">
              Notifications ({notifications.filter(n => !n.read).length})
            </TabsTrigger>
            <TabsTrigger value="raises">
              Demandes d'augmentation ({raiseRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <Card className="border-amber-100 shadow-lg">
              <CardContent className="p-0">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-amber-50">
                    {notifications.map((notif, idx) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 sm:p-6 hover:bg-amber-50/30 transition-colors ${!notif.read ? 'bg-amber-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!notif.read ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                                  <Badge variant="outline" className="text-xs">{notif.type}</Badge>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">{notif.message}</p>
                              </div>
                              {!notif.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-400 mt-2">
                              {notif.created_date && format(new Date(notif.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Aucune notification</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raises" className="mt-4">
            <Card className="border-amber-100 shadow-lg">
              <CardContent className="p-0">
                {raiseRequests.length > 0 ? (
                  <div className="divide-y divide-amber-50">
                    {raiseRequests.map((request, idx) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.requesterName}</h3>
                              <Badge variant="outline" className="text-xs mt-1">
                                {request.requesterType === 'driver' ? 'Chauffeur' : 'Responsable Bus'}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-2">
                                Salaire actuel: <span className="font-semibold">{request.currentSalary || 0} DH</span>
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                <span className="font-medium">Raisons:</span> {request.reasons}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRaiseRequest(request, true)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRaiseRequest(request, false)}
                              className="border-red-300 text-red-600"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Aucune demande d'augmentation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}