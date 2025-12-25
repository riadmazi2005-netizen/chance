import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import apiService from '@/services/apiService';
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
  Bell, FileText, UserCog, Loader2, PlusCircle, Edit, Trash2, Save, Phone, BarChart3
} from 'lucide-react';

export default function AdminSupervisors() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    salary: '',
    password: ''
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
      const [supervisorsData, busesData] = await Promise.all([
        apiService.entities.Supervisor.list(),
        apiService.entities.Bus.list()
      ]);
      
      const supervisorsWithBus = supervisorsData.map(s => {
        const bus = busesData.find(b => b.supervisorId === s.id);
        return { ...s, busName: bus?.busId || '-' };
      });
      
      setSupervisors(supervisorsWithBus);
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
      const data = {
        ...formData,
        salary: parseFloat(formData.salary) || 0
      };

      if (editingSupervisor) {
        const { password, ...updateData } = data;
        await apiService.entities.Supervisor.update(editingSupervisor.id, password ? data : updateData);
      } else {
        await apiService.entities.Supervisor.create(data);
      }

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving supervisor:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSupervisor = async (supervisor) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce responsable ?')) return;
    try {
      await apiService.entities.Supervisor.delete(supervisor.id);
      loadData();
    } catch (error) {
      console.error('Error deleting supervisor:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      salary: '',
      password: ''
    });
    setEditingSupervisor(null);
  };

  const openEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      firstName: supervisor.firstName,
      lastName: supervisor.lastName,
      phone: supervisor.phone,
      email: supervisor.email || '',
      salary: supervisor.salary?.toString() || '',
      password: ''
    });
    setShowDialog(true);
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog },
    { label: 'Responsables', path: 'AdminSupervisors', icon: UserCog, active: true },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Responsables Bus</h1>
          <Button 
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter un responsable
          </Button>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Responsable',
              render: (_, s) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold">
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{s.firstName} {s.lastName}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'phone',
              label: 'Téléphone',
              render: (v) => (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {v}
                </span>
              )
            },
            { key: 'email', label: 'Email', render: (v) => v || '-' },
            { key: 'salary', label: 'Salaire', render: (v) => `${v || 0} DH` },
            { key: 'busName', label: 'Bus Supervisé' }
          ]}
          data={supervisors}
          searchPlaceholder="Rechercher un responsable..."
          actions={(supervisor) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(supervisor)} className="border-amber-300">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteSupervisor(supervisor)} className="border-red-300 text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          emptyMessage="Aucun responsable enregistré"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupervisor ? 'Modifier le responsable' : 'Ajouter un responsable'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Salaire (DH)</Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email (optionnel)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>{editingSupervisor ? 'Nouveau mot de passe (laisser vide pour garder)' : 'Mot de passe'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingSupervisor ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}