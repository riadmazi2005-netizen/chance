import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { adminApi } from  '@/services/apiService';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, PlusCircle, Edit, Trash2, Save, BarChart3
} from 'lucide-react';

export default function AdminBuses() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    busId: '',
    matricule: '',
    capacity: '',
    driverId: '',
    supervisorId: '',
    routeId: '',
    status: 'en_service'
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
      const [busesData, driversData, supervisorsData, routesData] = await Promise.all([
        tutorApi.entities.Bus.list(),
        tutorApi.entities.Driver.list(),
        tutorApi.entities.Supervisor.list(),
        tutorApi.entities.Route.list()
      ]);
      
      const busesWithDetails = busesData.map(b => {
        const driver = driversData.find(d => d.id === b.driverId);
        const supervisor = supervisorsData.find(s => s.id === b.supervisorId);
        const route = routesData.find(r => r.id === b.routeId);
        return { 
          ...b, 
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : '-',
          supervisorName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '-',
          routeName: route?.terminus || '-'
        };
      });
      
      setBuses(busesWithDetails);
      setDrivers(driversData.filter(d => d.status === 'active'));
      setSupervisors(supervisorsData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingBus) {
        await tutorApi.entities.Bus.update(editingBus.id, data);
      } else {
        await tutorApi.entities.Bus.create(data);
      }

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving bus:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBus = async (bus) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bus ?')) return;
    try {
      await tutorApi.entities.Bus.delete(bus.id);
      loadData();
    } catch (error) {
      console.error('Error deleting bus:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      busId: '',
      matricule: '',
      capacity: '',
      driverId: '',
      supervisorId: '',
      routeId: '',
      status: 'en_service'
    });
    setEditingBus(null);
  };

  const openEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      busId: bus.busId,
      matricule: bus.matricule,
      capacity: bus.capacity?.toString() || '',
      driverId: bus.driverId || '',
      supervisorId: bus.supervisorId || '',
      routeId: bus.routeId || '',
      status: bus.status || 'en_service'
    });
    setShowDialog(true);
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus, active: true },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Bus</h1>
          <Button 
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter un bus
          </Button>
        </div>

        <DataTable
          columns={[
            { key: 'busId', label: 'ID Bus' },
            { key: 'matricule', label: 'Matricule' },
            { key: 'capacity', label: 'Capacité' },
            { key: 'driverName', label: 'Chauffeur' },
            { key: 'supervisorName', label: 'Responsable' },
            { key: 'routeName', label: 'Trajet' },
            {
              key: 'status',
              label: 'Statut',
              render: (v) => (
                <Badge className={v === 'en_service' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {v === 'en_service' ? 'En service' : 'Hors service'}
                </Badge>
              )
            }
          ]}
          data={buses}
          searchPlaceholder="Rechercher un bus..."
          filters={[
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'en_service', label: 'En service' },
                { value: 'hors_service', label: 'Hors service' }
              ]
            }
          ]}
          actions={(bus) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(bus)} className="border-amber-300">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteBus(bus)} className="border-red-300 text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          emptyMessage="Aucun bus enregistré"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBus ? 'Modifier le bus' : 'Ajouter un bus'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Bus</Label>
                <Input
                  value={formData.busId}
                  onChange={(e) => setFormData({...formData, busId: e.target.value})}
                  placeholder="Bus 001"
                />
              </div>
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input
                  value={formData.matricule}
                  onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                  placeholder="12345-A-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacité</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_service">En service</SelectItem>
                    <SelectItem value="hors_service">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chauffeur</Label>
              <Select value={formData.driverId} onValueChange={(v) => setFormData({...formData, driverId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucun</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={formData.supervisorId} onValueChange={(v) => setFormData({...formData, supervisorId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucun</SelectItem>
                  {supervisors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trajet</Label>
              <Select value={formData.routeId} onValueChange={(v) => setFormData({...formData, routeId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un trajet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucun</SelectItem>
                  {routes.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.routeId} - {r.terminus}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingBus ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}