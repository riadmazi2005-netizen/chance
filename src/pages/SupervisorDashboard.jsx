import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supervisorApi } from  '@/services/apiService';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bus, Users, UserCog, Bell, AlertTriangle, DollarSign,
  Phone, Clock, Send, Loader2, User, FileText, Eye, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [bus, setBus] = useState(null);
  const [driver, setDriver] = useState(null);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notifyType, setNotifyType] = useState('delay');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [raiseReason, setRaiseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'supervisor') {
      navigate(createPageUrl('SupervisorLogin'));
      return;
    }
    setCurrentUser(user);
    loadData(user);
  }, []);

  const loadData = async (user) => {
    try {
      // Get supervisor's bus
      const buses = await supervisorApi.entities.Bus.filter({ supervisorId: user.id });
      const myBus = buses[0];
      setBus(myBus);

      if (myBus) {
        // Get driver
        if (myBus.driverId) {
          const drivers = await supervisorApi.entities.Driver.list();
          setDriver(drivers.find(d => d.id === myBus.driverId));
        }

        // Get students for this bus
        const allStudents = await supervisorApi.entities.Student.filter({ busId: myBus.id, status: 'approved' });
        
        // Get tutors for phone numbers
        const tutors = await supervisorApi.entities.Tutor.list();
        const studentsWithTutors = allStudents.map(s => {
          const tutor = tutors.find(t => t.id === s.tutorId);
          return { ...s, tutorPhone: tutor?.phone, tutorName: `${tutor?.firstName} ${tutor?.lastName}` };
        });
        setStudents(studentsWithTutors);

        // Get accidents for this bus's driver
        if (myBus.driverId) {
          const allAccidents = await supervisorApi.entities.Accident.filter({ driverId: myBus.driverId });
          setAccidents(allAccidents);
        }
      }

      // Get notifications
      const notifs = await supervisorApi.entities.Notification.filter({ 
        recipientId: user.id, 
        recipientType: 'supervisor' 
      });
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);

    try {
      // Find the student's tutor
      const student = students.find(s => s.id === selectedStudent);
      
      const titles = {
        delay: 'Retard de votre enfant',
        absence: 'Absence de votre enfant',
        complaint: 'Notification du responsable bus'
      };

      await supervisorApi.entities.Notification.create({
        recipientId: student.tutorId,
        recipientType: 'tutor',
        type: notifyType,
        title: titles[notifyType],
        message: notifyMessage || `Concernant ${student.firstName} ${student.lastName}`,
        senderId: currentUser.id,
        senderType: 'supervisor'
      });

      // Update absence count if it's an absence
      if (notifyType === 'absence') {
        await supervisorApi.entities.Student.update(student.id, {
          absenceCount: (student.absenceCount || 0) + 1
        });
        loadData(currentUser);
      }

      setShowNotifyDialog(false);
      setSelectedStudent(null);
      setNotifyMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const requestRaise = async () => {
    setSubmitting(true);
    try {
      await supervisorApi.entities.RaiseRequest.create({
        requesterId: currentUser.id,
        requesterType: 'supervisor',
        currentSalary: currentUser.salary || 0,
        reasons: raiseReason,
        status: 'pending'
      });

      // Notify admin
      await supervisorApi.entities.Notification.create({
        recipientId: 'admin',
        recipientType: 'admin',
        type: 'raise_request',
        title: 'Demande d\'augmentation',
        message: `${currentUser.firstName} ${currentUser.lastName} (Responsable Bus) demande une augmentation`,
        senderId: currentUser.id,
        senderType: 'supervisor'
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

  const menuItems = [
    { label: 'Tableau de bord', path: 'SupervisorDashboard', icon: UserCog, active: true },
    { label: 'Présences', path: 'SupervisorAttendance', icon: CheckCircle },
    { label: 'Élèves', path: 'SupervisorStudents', icon: Users },
    { label: 'Notifications', path: 'SupervisorNotifications', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const groupA = students.filter(s => s.busGroup === 'A');
  const groupB = students.filter(s => s.busGroup === 'B');

  return (
    <DashboardLayout
      userType="Espace Responsable Bus"
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
            <p className="text-gray-500 mt-1">Responsable Bus</p>
          </div>
          <Button 
            onClick={() => setShowRaiseDialog(true)}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Demander augmentation
          </Button>
        </div>

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
            title="Accidents Chauffeur"
            value={accidents.length}
            icon={AlertTriangle}
            color={accidents.length >= 3 ? 'red' : 'amber'}
          />
        </div>

        {/* Bus & Driver Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-600" />
                Informations Bus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {bus ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID Bus:</span>
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
                <User className="w-5 h-5 text-amber-600" />
                Chauffeur Assigné
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {driver ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom:</span>
                    <span className="font-semibold">{driver.firstName} {driver.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone:</span>
                    <span className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {driver.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accidents:</span>
                    <Badge className={accidents.length >= 3 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                      {accidents.length} accident(s)
                    </Badge>
                  </div>
                  {accidents.length >= 3 && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        3 accidents = Licenciement + 1000 DH amende
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun chauffeur assigné</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Groups Schedule */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Horaires des Groupes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3">Groupe A ({groupA.length} élèves)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Matin:</span>
                    <span className="font-medium">07h00 – 07h30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Soir:</span>
                    <span className="font-medium">16h30 – 17h00</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h4 className="font-semibold text-purple-800 mb-3">Groupe B ({groupB.length} élèves)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-600">Matin:</span>
                    <span className="font-medium">07h30 – 08h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">Soir:</span>
                    <span className="font-medium">17h30 – 18h00</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Liste des Élèves
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
                  key: 'gender',
                  label: 'Sexe',
                  render: (v) => v === 'male' ? 'Garçon' : 'Fille'
                },
                {
                  key: 'busGroup',
                  label: 'Groupe',
                  render: (v) => (
                    <Badge className={v === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                      Groupe {v}
                    </Badge>
                  )
                },
                {
                  key: 'tutorPhone',
                  label: 'Tél. Tuteur',
                  render: (v) => (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {v || '-'}
                    </span>
                  )
                },
                {
                  key: 'absenceCount',
                  label: 'Absences',
                  render: (v) => (
                    <Badge variant="outline" className={v > 3 ? 'border-red-300 text-red-700' : 'border-gray-300'}>
                      {v || 0}
                    </Badge>
                  )
                }
              ]}
              data={students}
              searchPlaceholder="Rechercher un élève..."
              filters={[
                {
                  key: 'busGroup',
                  label: 'Groupe',
                  options: [
                    { value: 'A', label: 'Groupe A' },
                    { value: 'B', label: 'Groupe B' }
                  ]
                },
                {
                  key: 'gender',
                  label: 'Sexe',
                  options: [
                    { value: 'male', label: 'Garçon' },
                    { value: 'female', label: 'Fille' }
                  ]
                }
              ]}
              actions={(student) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(student.id);
                    setShowNotifyDialog(true);
                  }}
                  className="border-amber-300 text-amber-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Notifier
                </Button>
              )}
              emptyMessage="Aucun élève dans ce bus"
            />
          </CardContent>
        </Card>
      </div>

      {/* Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une notification au tuteur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de notification</Label>
              <Select value={notifyType} onValueChange={setNotifyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delay">Retard</SelectItem>
                  <SelectItem value="absence">Absence</SelectItem>
                  <SelectItem value="complaint">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Détails de la notification..."
                rows={4}
              />
            </div>

            <Button 
              onClick={sendNotification}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Envoyer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </DashboardLayout>
  );
}