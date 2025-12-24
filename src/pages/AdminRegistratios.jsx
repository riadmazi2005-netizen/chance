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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, CheckCircle, XCircle, Eye, BarChart3
} from 'lucide-react';

export default function AdminRegistrations() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const [studentsData, busesData, tutorsData] = await Promise.all([
        mockApi.entities.Student.filter({ status: 'pending' }),
        mockApi.entities.Bus.list(),
        mockApi.entities.Tutor.list()
      ]);
      
      const studentsWithTutors = studentsData.map(s => {
        const tutor = tutorsData.find(t => t.id === s.tutorId);
        return { ...s, tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : '-', tutorPhone: tutor?.phone };
      });
      
      setStudents(studentsWithTutors);
      setBuses(busesData);
      setTutors(tutorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async () => {
    setSubmitting(true);
    
    try {
      // Update student status to approved WITHOUT bus assignment
      await mockApi.entities.Student.update(selectedStudent.id, {
        status: 'approved'
      });

      // Create payment record
      const amount = selectedStudent.subscriptionType === 'annuel' ? 3000 : 300;
      await mockApi.entities.Payment.create({
        studentId: selectedStudent.id,
        tutorId: selectedStudent.tutorId,
        amount,
        transportType: selectedStudent.transportType,
        subscriptionType: selectedStudent.subscriptionType,
        status: 'pending'
      });

      // Notify tutor
      await mockApi.entities.Notification.create({
        recipientId: selectedStudent.tutorId,
        recipientType: 'tutor',
        type: 'validation',
        title: 'Inscription validée !',
        message: `L'inscription de ${selectedStudent.firstName} ${selectedStudent.lastName} a été validée. Veuillez procéder au paiement de ${amount} DH à l'école pour finaliser l'inscription.`,
        senderId: 'admin',
        senderType: 'admin'
      });

      setShowApproveDialog(false);
      setSelectedStudent(null);
      setSelectedBus('');
      setSelectedGroup('');
      loadData();
    } catch (error) {
      console.error('Error approving student:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const rejectStudent = async (student) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) return;
    
    try {
      await mockApi.entities.Student.update(student.id, { status: 'rejected' });

      await mockApi.entities.Notification.create({
        recipientId: student.tutorId,
        recipientType: 'tutor',
        type: 'validation',
        title: 'Inscription refusée',
        message: `L'inscription de ${student.firstName} ${student.lastName} a été refusée. Veuillez contacter l'administration.`,
        senderId: 'admin',
        senderType: 'admin'
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting student:', error);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText, active: true },
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Demandes d'inscription</h1>
          <Badge className="bg-yellow-100 text-yellow-800">{students.length} en attente</Badge>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Élève',
              render: (_, s) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold">
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.class}</p>
                  </div>
                </div>
              )
            },
            { key: 'age', label: 'Âge' },
            {
              key: 'gender',
              label: 'Genre',
              render: (v) => v === 'male' ? 'Garçon' : 'Fille'
            },
            { key: 'quarter', label: 'Quartier' },
            { key: 'address', label: 'Adresse' },
            {
              key: 'transportType',
              label: 'Type',
              render: (v) => <Badge variant="outline">{v}</Badge>
            },
            {
              key: 'subscriptionType',
              label: 'Abonnement',
              render: (v) => <Badge className="bg-amber-100 text-amber-800">{v}</Badge>
            },
            {
              key: 'tutorName',
              label: 'Tuteur',
              render: (v, s) => (
                <div>
                  <p className="text-sm">{v}</p>
                  <p className="text-xs text-gray-500">{s.tutorPhone}</p>
                </div>
              )
            }
          ]}
          data={students}
          searchPlaceholder="Rechercher une demande..."
          actions={(student) => (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedStudent(student);
                  setShowApproveDialog(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectStudent(student)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
          emptyMessage="Aucune demande en attente"
        />
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider l'inscription</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                <p className="text-sm text-gray-600">Classe: {selectedStudent.class}</p>
                <p className="text-sm text-gray-600">Quartier: {selectedStudent.quarter}</p>
                <p className="text-sm text-gray-600">Adresse: {selectedStudent.address}</p>
                <p className="text-sm font-semibold text-amber-700 mt-2">
                  Montant: {selectedStudent.subscriptionType === 'annuel' ? '3000 DH' : '300 DH'}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ L'affectation au bus sera faite après validation du paiement
                </p>
              </div>

              <Button 
                onClick={approveStudent}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Valider l'inscription
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}