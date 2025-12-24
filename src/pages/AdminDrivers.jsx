import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
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
  Bell, FileText, UserCog, Loader2, PlusCircle, Edit, Trash2, Save, Phone, BarChart3
} from 'lucide-react';

export default function AdminDrivers() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    cin: '',
    phone: '',
    email: '',
    licenseNumber: '',
    age: '',
    salary: '',
    password: '',
    status: 'active'
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
      const [driversData, busesData, accidentsData] = await Promise.all([
        mockApi.entities.Driver.list(),
        mockApi.entities.Bus.list(),
        mockApi.entities.Accident.list()
      ]);
      
      const driversWithDetails = driversData.map(d => {
        const bus = busesData.find(b => b.driverId === d.id);
        const driverAccidents = accidentsData.filter(a => a.driverId === d.id);
        return { ...d, busName: bus?.busId || '-', accidentCount: driverAccidents.length };
      });
      
      setDrivers(driversWithDetails);
      setBuses(busesData);
      setAccidents(accidentsData);
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
        age: parseInt(formData.age),
        salary: parseFloat(formData.salary)
      };

      if (editingDriver) {
        const { password, ...updateData } = data;
        await mockApi.entities.Driver.update(editingDriver.id, password ? data : updateData);
      } else {
        await mockApi.entities.Driver.create(data);
      }

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving driver:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDriver = async (driver) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) return;
    try {
      await mockApi.entities.Driver.delete(driver.id);
      loadData();
    } catch (error) {
      console.error('Error deleting driver:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      cin: '',
      phone: '',
      email: '',
      licenseNumber: '',
      age: '',
      salary: '',
      password: '',
      status: 'active'
    });
    setEditingDriver(null);
  };

  const openEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      cin: driver.cin,
      phone: driver.phone,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber,
      age: driver.age?.toString() || '',
      salary: driver.salary?.toString() || '',
      password: '',
      status: driver.status
    });
    setShowDialog(true);
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog, active: true },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Chauffeurs</h1>
          <Button 
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter un chauffeur
          </Button>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Chauffeur',
              render: (_, d) => (
                <div>
                  <p className="font-medium">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-gray-500">CIN: {d.cin}</p>
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
            { key: 'licenseNumber', label: 'Permis' },
            { key: 'age', label: 'Âge' },
            { key: 'salary', label: 'Salaire', render: (v) => `${v || 0} DH` },
            { key: 'busName', label: 'Bus Affecté' },
            {
              key: 'accidentCount',
              label: 'Accidents',
              render: (v) => (
                <Badge className={v >= 3 ? 'bg-red-100 text-red-800' : v >= 2 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                  {v}
                </Badge>
              )
            },
            {
              key: 'status',
              label: 'Statut',
              render: (v) => {
                const styles = {
                  active: 'bg-green-100 text-green-800',
                  suspended: 'bg-yellow-100 text-yellow-800',
                  fired: 'bg-red-100 text-red-800'
                };
                const labels = { active: 'Actif', suspended: 'Suspendu', fired: 'Licencié' };
                return <Badge className={styles[v]}>{labels[v]}</Badge>;
              }
            }
          ]}
          data={drivers}
          searchPlaceholder="Rechercher un chauffeur..."
          filters={[
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'active', label: 'Actif' },
                { value: 'suspended', label: 'Suspendu' },
                { value: 'fired', label: 'Licencié' }
              ]
            }
          ]}
          actions={(driver) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(driver)} className="border-amber-300">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteDriver(driver)} className="border-red-300 text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          emptyMessage="Aucun chauffeur enregistré"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}</DialogTitle>
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
                <Label>CIN</Label>
                <Input
                  value={formData.cin}
                  onChange={(e) => setFormData({...formData, cin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>N° Permis</Label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Âge</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salaire (DH)</Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="fired">Licencié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{editingDriver ? 'Nouveau mot de passe (laisser vide pour garder)' : 'Mot de passe'}</Label>
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
              {editingDriver ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}