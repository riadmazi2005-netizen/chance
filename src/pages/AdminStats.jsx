import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import apiService from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, TrendingUp, Clock, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function AdminStats() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({});
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
      const [students, buses, drivers, routes, payments, accidents] = await Promise.all([
        apiService.entities.Student.filter({ status: 'approved' }),
        apiService.entities.Bus.list(),
        apiService.entities.Driver.list(),
        apiService.entities.Route.list(),
        apiService.entities.Payment.list(),
        apiService.entities.Accident.list()
      ]);

      // Bus usage
      const busUsage = buses.map(bus => ({
        name: bus.busId,
        students: students.filter(s => s.busId === bus.id).length,
        capacity: bus.capacity
      })).sort((a, b) => b.students - a.students);

      // Most used bus
      const mostUsedBus = busUsage[0];

      // Driver with most accidents
      const driverAccidents = drivers.map(d => ({
        name: `${d.firstName} ${d.lastName}`,
        accidents: accidents.filter(a => a.driverId === d.id).length
      })).sort((a, b) => b.accidents - a.accidents);

      // Students by class
      const classCounts = {};
      students.forEach(s => {
        classCounts[s.class] = (classCounts[s.class] || 0) + 1;
      });
      const studentsByClass = Object.entries(classCounts).map(([name, count]) => ({ name, count }));

      // Students with most absences
      const absentStudents = students
        .filter(s => s.absenceCount > 0)
        .sort((a, b) => (b.absenceCount || 0) - (a.absenceCount || 0))
        .slice(0, 5)
        .map(s => ({
          name: `${s.firstName} ${s.lastName}`,
          absences: s.absenceCount
        }));

      // Payment stats
      const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

      // Gender distribution
      const maleCount = students.filter(s => s.gender === 'male').length;
      const femaleCount = students.filter(s => s.gender === 'female').length;

      setStats({
        busUsage,
        mostUsedBus,
        driverAccidents,
        studentsByClass,
        absentStudents,
        totalRevenue,
        pendingRevenue,
        maleCount,
        femaleCount,
        totalStudents: students.length,
        totalBuses: buses.length,
        totalDrivers: drivers.length,
        totalRoutes: routes.length,
        totalAccidents: accidents.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell },
    { label: 'Statistiques', path: 'AdminStats', icon: BarChart3, active: true },
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
      notifications={[]}
    >
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analyse & Statistiques</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.totalRevenue?.toLocaleString()} DH</p>
              <p className="text-sm text-gray-500">Revenus Validés</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.pendingRevenue?.toLocaleString()} DH</p>
              <p className="text-sm text-gray-500">Revenus en Attente</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              <p className="text-sm text-gray-500">Élèves Inscrits</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.totalAccidents}</p>
              <p className="text-sm text-gray-500">Total Accidents</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bus Usage */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-600" />
                Utilisation des Bus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.busUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Élèves" />
                  <Bar dataKey="capacity" fill="#e5e7eb" radius={[8, 8, 0, 0]} name="Capacité" />
                </BarChart>
              </ResponsiveContainer>
              {stats.mostUsedBus && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Bus le plus utilisé:</span> {stats.mostUsedBus.name} ({stats.mostUsedBus.students} élèves)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students by Class */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Élèves par Classe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.studentsByClass}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    label={({name, count}) => `${name}: ${count}`}
                  >
                    {stats.studentsByClass?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Accidents */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Accidents par Chauffeur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.driverAccidents?.filter(d => d.accidents > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
                  <Tooltip />
                  <Bar dataKey="accidents" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Most Absent Students */}
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Élèves les Plus Absents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.absentStudents?.length > 0 ? (
                <div className="space-y-3">
                  {stats.absentStudents.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-amber-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800">{student.absences} absences</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune absence enregistrée</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gender Distribution */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Répartition par Genre
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-blue-600">{stats.maleCount}</span>
                </div>
                <p className="font-medium text-gray-700">Garçons</p>
                <p className="text-sm text-gray-500">{((stats.maleCount / stats.totalStudents) * 100).toFixed(1)}%</p>
              </div>
              
              <div className="w-px h-24 bg-gray-200" />
              
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-pink-600">{stats.femaleCount}</span>
                </div>
                <p className="font-medium text-gray-700">Filles</p>
                <p className="text-sm text-gray-500">{((stats.femaleCount / stats.totalStudents) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}