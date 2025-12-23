import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Bus, Users, MapPin, Bell, AlertTriangle, DollarSign,
  Phone, Clock, Send, Loader2, User, FileText, Save
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [raiseReason, setRaiseReason] = useState('');
  const [profileData, setProfileData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'driver') {
      navigate(createPageUrl('DriverLogin'));
      return;
    }
    setCurrentUser(user);
    setProfileData({
      phone: user.phone || '',
      email: user.email || ''
    });
    loadData(user);
  }, []);

  const loadData = async (user) => {
    try {
      // Get driver's bus
      const buses = await mockApi.entities.Bus.filter({ driverId: user.id });
      const myBus = buses[0];
      setBus(myBus);

      if (myBus) {
        // Get route
        if (myBus.routeId) {
          const routes = await mockApi.entities.Route.list();
          setRoute(routes.find(r => r.id === myBus.routeId));
        }

        // Get supervisor
        if (myBus.supervisorId) {
          const supervisors = await mockApi.entities.Supervisor.list();
          setSupervisor(supervisors.find(s => s.id === myBus.supervisorId));
        }

        // Get students
        const allStudents = await mockApi.entities.Student.filter({ busId: myBus.id, status: 'approved' });
        const tutors = await mockApi.entities.Tutor.list();
        const studentsWithTutors = allStudents.map(s => {
          const tutor = tutors.find(t => t.id === s.tutorId);
          return { ...s, tutorPhone: tutor?.phone };
        });
        setStudents(studentsWithTutors);
      }

      // Get accidents
      const allAccidents = await mockApi.entities.Accident.filter({ driverId: user.id });
      setAccidents(allAccidents);

      // Get notifications
      const notifs = await mockApi.entities.Notification.filter({ 
        recipientId: user.id, 
        recipientType: 'driver' 
      });
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestRaise = async () => {
    setSubmitting(true);
    try {
      await mockApi.entities.RaiseRequest.create({
        requesterId: currentUser.id,
        requesterType: 'driver',
        currentSalary: currentUser.salary || 0,
        reasons: raiseReason,
        status: 'pending'
      });

      await mockApi.entities.Notification.create({
        recipientId: 'admin',
        recipientType: 'admin',
        type: 'raise_request',
        title: 'Demande d\'augmentation',
        message: `${currentUser.firstName} ${currentUser.lastName} (Chauffeur) demande une augmentation`,
        senderId: currentUser.id,
        senderType: 'driver'
      });

      setShowRaiseDialog(false);
      setRaiseReason('');
      alert('Demande envoyée avec succès !');
    } catch (error) {
      console.error('Error requesting raise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async () => {
    setSubmitting(true);
    try {
      await mockApi.entities.Driver.update(currentUser.id, profileData);
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowProfileDialog(false);
      alert('Profil mis à jour !');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'DriverDashboard', icon: Bus, active: true },
    { label: 'Mes Élèves', path: 'DriverStudents', icon: Users },
    { label: 'Notifications', path: 'DriverNotifications', icon: Bell },
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
      userType="Espace Chauffeur"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={notifications}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Bienvenue, {currentUser?.firstName} !
            </h1>
            <p className="text-gray-500 mt-1">Chauffeur</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowProfileDialog(true)}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <User className="w-4 h-4 mr-2" />
              Mon Profil
            </Button>
            <Button 
              onClick={() => setShowRaiseDialog(true)}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Augmentation
            </Button>
          </div>
        </div>

        {/* Warning for accidents */}
        {accidents.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${accidents.length >= 3 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${accidents.length >= 3 ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <p className={`font-semibold ${accidents.length >= 3 ? 'text-red-800' : 'text-orange-800'}`}>
                  {accidents.length >= 3 
                    ? '⚠️ ATTENTION: 3 accidents = Licenciement + 1000 DH amende' 
                    : `Attention: Vous avez ${accidents.length} accident(s). 3 accidents = licenciement.`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mon Bus"
            value={bus?.busId || '-'}
            icon={Bus}
            color="amber"
            subtitle={`Capacité: ${bus?.capacity || 0} places`}
          />
          <StatCard
            title="Total Élèves"
            value={students.length}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Mon Salaire"
            value={`${currentUser?.salary || 0} DH`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Accidents"
            value={accidents.length}
            icon={AlertTriangle}
            color={accidents.length >= 3 ? 'red' : accidents.length >= 2 ? 'amber' : 'green'}
          />
        </div>

        {/* Bus, Route & Supervisor Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-600" />
                Mon Bus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {bus ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-semibold">{bus.busId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matricule:</span>
                    <span className="font-semibold">{bus.matricule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacité:</span>
                    <span className="font-semibold">{bus.capacity} places</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut:</span>
                    <Badge className={bus.status === 'en_service' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {bus.status === 'en_service' ? 'En service' : 'Hors service'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun bus assigné</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Mon Trajet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {route ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Départ:</span>
                    <span className="font-semibold">{route.departure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Terminus:</span>
                    <span className="font-semibold">{route.terminus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matin:</span>
                    <span className="font-semibold">{route.departureTimeMorning} - {route.arrivalTimeMorning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Soir:</span>
                    <span className="font-semibold">{route.departureTimeEvening} - {route.arrivalTimeEvening}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun trajet assigné</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Responsable Bus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {supervisor ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom:</span>
                    <span className="font-semibold">{supervisor.firstName} {supervisor.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {supervisor.phone}
                    </span>
                  </div>
                  {supervisor.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-semibold text-sm">{supervisor.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun responsable assigné</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Students Preview */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Mes Élèves
              </span>
              <Badge className="bg-amber-100 text-amber-800">{students.length} élèves</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Élève',
                  render: (_, s) => (
                    <div>
                      <p className="font-medium">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.class}</p>
                    </div>
                  )
                },
                { key: 'age', label: 'Âge' },
                {
                  key: 'busGroup',
                  label: 'Groupe',
                  render: (v) => (
                    <Badge className={v === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                      Groupe {v || '-'}
                    </Badge>
                  )
                },
                {
                  key: 'tutorPhone',
                  label: 'Tél. Tuteur',
                  render: (v) => (
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3" />
                      {v || '-'}
                    </span>
                  )
                },
                {
                  key: 'absenceCount',
                  label: 'Absences',
                  render: (v) => <Badge variant="outline">{v || 0}</Badge>
                }
              ]}
              data={students.slice(0, 5)}
              searchable={false}
              emptyMessage="Aucun élève"
            />
          </CardContent>
        </Card>
      </div>

      {/* Raise Request Dialog */}
      <Dialog open={showRaiseDialog} onOpenChange={setShowRaiseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une augmentation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-gray-600">Salaire actuel:</p>
              <p className="text-2xl font-bold text-amber-600">{currentUser?.salary || 0} DH</p>
            </div>

            <div className="space-y-2">
              <Label>Raisons de la demande</Label>
              <Textarea
                value={raiseReason}
                onChange={(e) => setRaiseReason(e.target.value)}
                placeholder="Expliquez les raisons de votre demande..."
                rows={4}
              />
            </div>

            <Button 
              onClick={requestRaise}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting || !raiseReason}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer la demande
            </Button>
          </div>
          </DialogContent>
      </Dialog>
  {/* Profile Dialog */}
  <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Mon Profil</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
          />
        </div>

        <Button 
          onClick={saveProfile}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</DashboardLayout>
);
}