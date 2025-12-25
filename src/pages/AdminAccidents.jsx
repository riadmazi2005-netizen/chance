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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, PlusCircle, Save, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAccidents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [accidents, setAccidents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    driverId: '',
    busId: '',
    date: new Date().toISOString().split('T')[0],
    report: '',
    severity: 'minor'
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
      const [accidentsData, driversData, busesData] = await Promise.all([
        apiService.entities.Accident.list(),
        apiService.entities.Driver.list(),
        apiService.entities.Bus.list()
      ]);
      
      const accidentsWithDetails = accidentsData.map(a => {
        const driver = driversData.find(d => d.id === a.driverId);
        const bus = busesData.find(b => b.id === a.busId);
        return { 
          ...a, 
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : '-',
          busName: bus?.busId || '-'
        };
      });
      
      setAccidents(accidentsWithDetails);
      setDrivers(driversData.filter(d => d.status !== 'fired'));
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
      // Create accident record
      await apiService.entities.Accident.create(formData);

      // Get driver's current accident count
      const driverAccidents = accidents.filter(a => a.driverId === formData.driverId);
      const newCount = driverAccidents.length + 1;

      // Update driver's accident count
      await apiService.entities.Driver.update(formData.driverId, {
        accidentCount: newCount
      });

      // Notify driver
      await apiService.entities.Notification.create({
        recipientId: formData.driverId,
        recipientType: 'driver',
        type: 'accident',
        title: 'Accident déclaré',
        message: newCount >= 3 
          ? '⚠️ ATTENTION: Vous avez atteint 3 accidents. Licenciement + 1000 DH amende.'
          : `Un accident a été déclaré. Total: ${newCount} accident(s).`,
        senderId: 'admin',
        senderType: 'admin'
      });

      // If 3 accidents, fire the driver
      if (newCount >= 3) {
        await apiService.entities.Driver.update(formData.driverId, {
          status: 'fired'
        });
      }

      setShowDialog(false);
      setFormData({
        driverId: '',
        busId: '',
        date: new Date().toISOString().split('T')[0],
        report: '',
        severity: 'minor'
      });
      loadData();
    } catch (error) {
      console.error('Error saving accident:', error);
    } finally {
      setSubmitting(false);
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
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle, active: true },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Déclaration des Accidents</h1>
          <Button 
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Déclarer un accident
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Règle des 3 accidents</p>
              <p className="text-sm text-red-600">3 accidents = Licenciement automatique + Amende de 1000 DH</p>
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'driverName', label: 'Chauffeur' },
            { key: 'busName', label: 'Bus' },
            {
              key: 'date',
              label: 'Date',
              render: (v) => format(new Date(v), 'd MMM yyyy', { locale: fr })
            },
            { key: 'report', label: 'Rapport' },
            {
              key: 'severity',
              label: 'Gravité',
              render: (v) => {
                const styles = {
                  minor: 'bg-yellow-100 text-yellow-800',
                  moderate: 'bg-orange-100 text-orange-800',
                  severe: 'bg-red-100 text-red-800'
                };
                const labels = { minor: 'Mineur', moderate: 'Modéré', severe: 'Grave' };
                return <Badge className={styles[v]}>{labels[v]}</Badge>;
              }
            }
          ]}
          data={accidents}
          searchPlaceholder="Rechercher un accident..."
          filters={[
            {
              key: 'severity',
              label: 'Gravité',
              options: [
                { value: 'minor', label: 'Mineur' },
                { value: 'moderate', label: 'Modéré' },
                { value: 'severe', label: 'Grave' }
              ]
            }
          ]}
          emptyMessage="Aucun accident déclaré"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Déclarer un accident</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chauffeur</Label>
              <Select value={formData.driverId} onValueChange={(v) => setFormData({...formData, driverId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bus</Label>
              <Select value={formData.busId} onValueChange={(v) => setFormData({...formData, busId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.busId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Gravité</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({...formData, severity: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Mineur</SelectItem>
                    <SelectItem value="moderate">Modéré</SelectItem>
                    <SelectItem value="severe">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rapport</Label>
              <Textarea
                value={formData.report}
                onChange={(e) => setFormData({...formData, report: e.target.value})}
                placeholder="Décrivez brièvement l'accident..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500"
              disabled={submitting || !formData.driverId || !formData.busId}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Déclarer l'accident
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}