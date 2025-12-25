import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle, Bell, FileText, UserCog, BarChart3, Calendar, Clock, TrendingUp, XCircle, Fuel } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminHistory() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'admin') {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    setCurrentUser(user);
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [students, accidents, payments, attendance, unsubscriptions] = await Promise.all([
        mockApi.entities.Student.list(),
        mockApi.entities.Accident.list(),
        mockApi.entities.Payment.list(),
        mockApi.entities.Attendance.list(),
        mockApi.entities.Unsubscription.list()
      ]);

      const allEvents = [];

      // New registrations
      students.filter(s => s.created_date?.startsWith(selectedDate)).forEach(s => {
        allEvents.push({
          time: s.created_date,
          type: 'registration',
          icon: Users,
          color: 'green',
          title: 'Nouvelle inscription',
          description: `${s.firstName} ${s.lastName} (${s.class})`
        });
      });

      // Unsubscriptions
      unsubscriptions.filter(u => u.created_date?.startsWith(selectedDate)).forEach(u => {
        const student = students.find(s => s.id === u.studentId);
        allEvents.push({
          time: u.created_date,
          type: 'unsubscription',
          icon: XCircle,
          color: 'red',
          title: 'Désinscription',
          description: `${student?.firstName} ${student?.lastName} - Raison: ${u.reason}`
        });
      });

      // Accidents
      accidents.filter(a => a.date === selectedDate).forEach(a => {
        allEvents.push({
          time: a.created_date,
          type: 'accident',
          icon: AlertTriangle,
          color: 'red',
          title: 'Accident',
          description: `${a.report} - Sévérité: ${a.severity}`
        });
      });

      // Payments
      payments.filter(p => p.paymentDate === selectedDate).forEach(p => {
        const student = students.find(s => s.id === p.studentId);
        allEvents.push({
          time: p.created_date,
          type: 'payment',
          icon: CreditCard,
          color: 'green',
          title: 'Paiement validé',
          description: `${student?.firstName} ${student?.lastName} - ${p.finalAmount} DH`
        });
      });

      // Absences
      attendance.filter(a => a.date === selectedDate && a.status === 'absent').forEach(a => {
        const student = students.find(s => s.id === a.studentId);
        allEvents.push({
          time: a.created_date,
          type: 'absence',
          icon: XCircle,
          color: 'orange',
          title: 'Absence',
          description: `${student?.firstName} ${student?.lastName} - ${a.period === 'morning' ? 'Matin' : 'Soir'}`
        });
      });

      allEvents.sort((a, b) => new Date(b.time) - new Date(a.time));
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
    { label: 'Augmentations', path: 'AdminRaiseRequests', icon: TrendingUp },
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard },
    { label: 'Dépenses Bus', path: 'AdminBusExpenses', icon: Fuel },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Absences', path: 'AdminAbsences', icon: Calendar },
    { label: 'Historique', path: 'AdminHistory', icon: Clock, active: true },
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell },
    { label: 'Statistiques', path: 'AdminStats', icon: BarChart3 },
  ];

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <DashboardLayout
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={[]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historique des Événements</h1>
          <Badge className="bg-amber-100 text-amber-800">{events.length} événements</Badge>
        </div>

        <Card className="border-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="max-w-xs border-amber-200"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle>
              {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={idx} className={`p-4 rounded-xl border-2 ${colorClasses[event.color]}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${event.color === 'green' ? 'bg-green-500' : event.color === 'red' ? 'bg-red-500' : event.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(event.time), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun événement enregistré pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}