import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bus, Bell, UserCog, Users, Loader2, PlusCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

export default function DriverExpenses() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [myBus, setMyBus] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'fuel',
    amount: '',
    description: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'driver') {
      navigate(createPageUrl('DriverLogin'));
      return;
    }
    setCurrentUser(user);
    loadData(user);
  }, []);

  const loadData = async (user) => {
    try {
      const buses = await mockApi.entities.Bus.filter({ driverId: user.id });
      const bus = buses[0];
      setMyBus(bus);

      if (bus) {
        const expensesData = await mockApi.entities.BusExpense.filter({ busId: bus.id });
        setExpenses(expensesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await mockApi.entities.BusExpense.create({
        busId: myBus.id,
        driverId: currentUser.id,
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });

      // Notify admin
      await mockApi.entities.Notification.create({
        recipientId: 'admin',
        recipientType: 'admin',
        type: 'general',
        title: 'Nouvelle dépense enregistrée',
        message: `${currentUser.firstName} ${currentUser.lastName} a enregistré une dépense de ${newExpense.amount} DH pour le bus ${myBus.busId}`,
        senderId: currentUser.id,
        senderType: 'driver'
      });

      toast.success('Dépense enregistrée', {
        icon: '✅',
        style: { background: '#10b981', color: '#fff' }
      });

      setShowDialog(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        type: 'fuel',
        amount: '',
        description: ''
      });
      loadData(currentUser);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'DriverDashboard', icon: UserCog },
    { label: 'Élèves', path: 'DriverStudents', icon: Users },
    { label: 'Dépenses', path: 'DriverExpenses', icon: DollarSign, active: true },
    { label: 'Notifications', path: 'DriverNotifications', icon: Bell },
  ];

  const typeLabels = {
    fuel: 'Essence',
    repair: 'Réparation',
    tire_inflation: 'Gonflage pneus',
    maintenance: 'Maintenance',
    other: 'Autre'
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      userType="Espace Chauffeur"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={[]}
    >
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dépenses Quotidiennes</h1>
            <p className="text-gray-500 mt-1">Bus {myBus?.busId}</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter une dépense
          </Button>
        </div>

        <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200">
          <p className="text-sm text-gray-600">Total des dépenses</p>
          <p className="text-3xl font-bold text-amber-600">{totalExpenses.toFixed(2)} DH</p>
        </div>

        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (v) => format(new Date(v), 'd MMM yyyy', { locale: fr })
            },
            {
              key: 'type',
              label: 'Type',
              render: (v) => <Badge variant="outline">{typeLabels[v]}</Badge>
            },
            {
              key: 'amount',
              label: 'Montant',
              render: (v) => <span className="font-semibold text-amber-600">{v} DH</span>
            },
            { key: 'description', label: 'Description' }
          ]}
          data={expenses}
          filters={[
            {
              key: 'type',
              label: 'Type',
              options: Object.entries(typeLabels).map(([value, label]) => ({ value, label }))
            }
          ]}
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une dépense</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type de dépense</Label>
              <Select value={newExpense.type} onValueChange={(value) => setNewExpense({...newExpense, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Montant (DH)</Label>
              <Input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Détails de la dépense..."
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}