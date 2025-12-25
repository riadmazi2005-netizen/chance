import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { tutorApi } from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle, Bell, FileText, UserCog, BarChart3, Calendar, TrendingDown, Fuel, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminBusExpenses() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [buses, setBuses] = useState([]);
  const [expenses, setExpenses] = useState([]);
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
      const [busesData, expensesData] = await Promise.all([
        tutorApi.entities.Bus.list(),
        tutorApi.entities.BusExpense.list()
      ]);
      
      setBuses(busesData);
      setExpenses(expensesData);
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
    { label: 'Dépenses Bus', path: 'AdminBusExpenses', icon: Fuel, active: true },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Absences', path: 'AdminAbsences', icon: Calendar },
    { label: 'Historique', path: 'AdminHistory', icon: Clock },
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell },
    { label: 'Statistiques', path: 'AdminStats', icon: BarChart3 },
  ];

  // Calculate expenses per bus
  const busExpenseStats = buses.map(bus => {
    const busExpenses = expenses.filter(e => e.busId === bus.id);
    const totalExpenses = busExpenses.reduce((sum, e) => sum + e.amount, 0);
    const fuelExpenses = busExpenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + e.amount, 0);
    const repairExpenses = busExpenses.filter(e => e.type === 'repair').reduce((sum, e) => sum + e.amount, 0);
    
    return {
      busId: bus.busId,
      totalExpenses,
      fuelExpenses,
      repairExpenses,
      expenseCount: busExpenses.length
    };
  }).sort((a, b) => a.totalExpenses - b.totalExpenses); // Sort by least consuming

  const chartData = busExpenseStats.slice(0, 10).map(stat => ({
    name: stat.busId,
    Essence: stat.fuelExpenses,
    Réparations: stat.repairExpenses
  }));

  return (
    <DashboardLayout
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={[]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dépenses par Bus</h1>
          <Badge className="bg-green-100 text-green-800">
            <TrendingDown className="w-4 h-4 mr-1" />
            Classés du moins au plus consommant
          </Badge>
        </div>

        {/* Chart */}
        <Card className="border-amber-100">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle>Comparaison des dépenses</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Essence" fill="#fbbf24" />
                <Bar dataKey="Réparations" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bus List */}
        <div className="grid gap-4">
          {busExpenseStats.map((stat, idx) => (
            <Card key={stat.busId} className="border-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                      idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{stat.busId}</h3>
                      <p className="text-sm text-gray-500">{stat.expenseCount} dépenses enregistrées</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{stat.totalExpenses.toFixed(2)} DH</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="border-yellow-300">
                        <Fuel className="w-3 h-3 mr-1" />
                        {stat.fuelExpenses.toFixed(0)} DH
                      </Badge>
                      <Badge variant="outline" className="border-orange-300">
                        Réparations: {stat.repairExpenses.toFixed(0)} DH
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}