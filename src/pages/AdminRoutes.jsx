import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockData } from '@/services/mockDataService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, PlusCircle, Edit, Trash2, Save, Clock, BarChart3
} from 'lucide-react';

export default function AdminRoutes() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    routeId: '',
    departure: 'École Mohammed V',
    terminus: '',
    departureTimeMorning: '',
    arrivalTimeMorning: '',
    departureTimeEvening: '',
    arrivalTimeEvening: ''
  });

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
      const [routesData, busesData] = await Promise.all([
        mockData.entities.Route.list(),
        mockData.entities.Bus.list()
      ]);
      
      const routesWithBus = routesData.map(r => {
        const bus = busesData.find(b => b.routeId === r.id);
        return { ...r, busName: bus?.busId || '-' };
      });
      
      setRoutes(routesWithBus);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingRoute) {
        await mockData.entities.Route.update(editingRoute.id, formData);
      } else {
        await mockData.entities.Route.create(formData);
      }

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving route:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRoute = async (route) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) return;
    try {
      await mockData.entities.Route.delete(route.id);
      loadData();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      departure: 'École Mohammed V',
      terminus: '',
      departureTimeMorning: '',
      arrivalTimeMorning: '',
      departureTimeEvening: '',
      arrivalTimeEvening: ''
    });
    setEditingRoute(null);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeId: route.routeId,
      departure: route.departure,
      terminus: route.terminus,
      departureTimeMorning: route.departureTimeMorning || '',
      arrivalTimeMorning: route.arrivalTimeMorning || '',
      departureTimeEvening: route.departureTimeEvening || '',
      arrivalTimeEvening: route.arrivalTimeEvening || ''
    });
    setShowDialog(true);
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin, active: true },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog },
    { label: 'Responsables', path: 'AdminSupervisors', icon: UserCog },
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Notifications', path: 'AdminNotifications', icon: Bell },
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
      notifications={[]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Trajets</h1>
          <Button 
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter un trajet
          </Button>
        </div>

        <DataTable
          columns={[
            { key: 'routeId', label: 'ID Trajet' },
            { key: 'departure', label: 'Départ' },
            { key: 'terminus', label: 'Terminus' },
            {
              key: 'morning',
              label: 'Horaire Matin',
              render: (_, r) => (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  {r.departureTimeMorning || '-'} - {r.arrivalTimeMorning || '-'}
                </div>
              )
            },
            {
              key: 'evening',
              label: 'Horaire Soir',
              render: (_, r) => (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  {r.departureTimeEvening || '-'} - {r.arrivalTimeEvening || '-'}
                </div>
              )
            },
            { key: 'busName', label: 'Bus Affecté' }
          ]}
          data={routes}
          searchPlaceholder="Rechercher un trajet..."
          actions={(route) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(route)} className="border-amber-300">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteRoute(route)} className="border-red-300 text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          emptyMessage="Aucun trajet enregistré"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Modifier le trajet' : 'Ajouter un trajet'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Trajet</Label>
                <Input
                  value={formData.routeId}
                  onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                  placeholder="Trajet 001"
                />
              </div>
              <div className="space-y-2">
                <Label>Départ</Label>
                <Input
                  value={formData.departure}
                  onChange={(e) => setFormData({...formData, departure: e.target.value})}
                  placeholder="École Mohammed V"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terminus</Label>
              <Input
                value={formData.terminus}
                onChange={(e) => setFormData({...formData, terminus: e.target.value})}
                placeholder="Hay Riad"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-3">Horaires Matin</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Départ</Label>
                  <Input
                    type="time"
                    value={formData.departureTimeMorning}
                    onChange={(e) => setFormData({...formData, departureTimeMorning: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrivée</Label>
                  <Input
                    type="time"
                    value={formData.arrivalTimeMorning}
                    onChange={(e) => setFormData({...formData, arrivalTimeMorning: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-3">Horaires Soir</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Départ</Label>
                  <Input
                    type="time"
                    value={formData.departureTimeEvening}
                    onChange={(e) => setFormData({...formData, departureTimeEvening: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrivée</Label>
                  <Input
                    type="time"
                    value={formData.arrivalTimeEvening}
                    onChange={(e) => setFormData({...formData, arrivalTimeEvening: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingRoute ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}