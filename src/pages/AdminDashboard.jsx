import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Clock, CheckCircle, XCircle, Loader2,
  TrendingUp, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
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
      const [students, buses, drivers, routes, payments, accidents, notifs] = await Promise.all([
        mockApi.entities.Student.list(),
        mockApi.entities.Bus.list(),
        mockApi.entities.Driver.list(),
        mockApi.entities.Route.list(),
        mockApi.entities.Payment.list(),
        mockApi.entities.Accident.list(),
        mockApi.entities.Notification.filter({ recipientType: 'admin' })
      ]);

      const approvedStudents = students.filter(s => s.status === 'approved');
      const pendingStudents = students.filter(s => s.status === 'pending');
      const paidPayments = payments.filter(p => p.status === 'paid');
      const pendingPayments = payments.filter(p => p.status === 'pending');
      const maleStudents = approvedStudents.filter(s => s.gender === 'male');
      const femaleStudents = approvedStudents.filter(s => s.gender === 'female');

      // Bus usage stats
      const busUsage = buses.map(bus => ({
        name: bus.busId,
        students: students.filter(s => s.busId === bus.id && s.status === 'approved').length
      })).sort((a, b) => b.students - a.students).slice(0, 5);

      setStats({
        totalStudents: students.length,
        approvedStudents: approvedStudents.length,
        pendingStudents: pendingStudents.length,
        totalBuses: buses.length,
        activeBuses: buses.filter(b => b.status === 'en_service').length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        totalRoutes: routes.length,
        totalPayments: payments.length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        totalAccidents: accidents.length,
        maleStudents: maleStudents.length,
        femaleStudents: femaleStudents.length,
        busUsage
      });

      setNotifications(notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck, active: true },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog },
    { label: 'Responsables', path: 'AdminSupervisors', icon: UserCog },
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell },
    { label: 'Statistiques', path: 'AdminStats', icon: BarChart3 },
  ];

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const genderData = [
    { name: 'Garçons', value: stats.maleStudents },
    { name: 'Filles', value: stats.femaleStudents }
  ];

  return (
    <DashboardLayout
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={notifications}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble du système de transport scolaire</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Élèves"
            value={stats.approvedStudents}
            icon={Users}
            color="amber"
            subtitle={`${stats.pendingStudents} en attente`}
          />
          <StatCard
            title="Bus Actifs"
            value={stats.activeBuses}
            icon={Bus}
            color="blue"
            subtitle={`sur ${stats.totalBuses} bus`}
          />
          <StatCard
            title="Paiements Validés"
            value={stats.paidPayments}
            icon={CreditCard}
            color="green"
            subtitle={`${stats.pendingPayments} en attente`}
          />
          <StatCard
            title="Accidents Totaux"
            value={stats.totalAccidents}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Chauffeurs"
            value={stats.activeDrivers}
            icon={UserCog}
            color="purple"
            subtitle={`sur ${stats.totalDrivers} total`}
          />
          <StatCard
            title="Trajets"
            value={stats.totalRoutes}
            icon={MapPin}
            color="blue"
          />
          <StatCard
            title="Garçons"
            value={stats.maleStudents}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Filles"
            value={stats.femaleStudents}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bus Usage Chart */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-600" />
                Bus les plus utilisés
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.busUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #fcd34d',
                      borderRadius: '12px'
                    }} 
                  />
                  <Bar dataKey="students" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Répartition par genre
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-600">Garçons ({stats.maleStudents})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-600">Filles ({stats.femaleStudents})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Actions */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Actions en attente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Link to={createPageUrl('AdminRegistrations')}>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Inscriptions en attente</span>
                  </div>
                  <Badge className="bg-yellow-500 text-white">{stats.pendingStudents}</Badge>
                </div>
              </Link>
              
              <Link to={createPageUrl('AdminPayments')}>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Paiements en attente</span>
                  </div>
                  <Badge className="bg-orange-500 text-white">{stats.pendingPayments}</Badge>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                Notifications récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length > 0 ? (
                <div className="divide-y divide-amber-50">
                  {notifications.slice(0, 4).map((notif, idx) => (
                    <div key={notif.id} className={`p-4 ${!notif.read ? 'bg-amber-50/50' : ''}`}>
                      <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucune notification</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}