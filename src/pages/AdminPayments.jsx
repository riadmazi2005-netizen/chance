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
  Bell, FileText, UserCog, Loader2, BarChart3, CheckCircle, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPayments() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
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
      const [paymentsData, studentsData, tutorsData, busesData] = await Promise.all([
        mockApi.entities.Payment.list(),
        mockApi.entities.Student.list(),
        mockApi.entities.Tutor.list(),
        mockApi.entities.Bus.list()
      ]);
      
      const paymentsWithDetails = paymentsData.map(p => {
        const student = studentsData.find(s => s.id === p.studentId);
        const tutor = tutorsData.find(t => t.id === p.tutorId);
        return { 
          ...p, 
          studentName: student ? `${student.firstName} ${student.lastName}` : '-',
          studentClass: student?.class,
          tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : '-',
          student: student
        };
      });
      
      setPayments(paymentsWithDetails);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignToBus = async () => {
    if (!selectedBus || !selectedGroup) return;
    setSubmitting(true);
    
    try {
      const bus = buses.find(b => b.id === selectedBus);
      
      // Update student with bus assignment
      await mockApi.entities.Student.update(selectedPayment.studentId, {
        busId: selectedBus,
        busGroup: selectedGroup,
        routeId: bus?.routeId,
        paymentStatus: 'paid'
      });

      // Update payment status
      await mockApi.entities.Payment.update(selectedPayment.id, {
        status: 'paid',
        paymentDate: new Date().toISOString().split('T')[0]
      });

      // Notify tutor
      await mockApi.entities.Notification.create({
        recipientId: selectedPayment.tutorId,
        recipientType: 'tutor',
        type: 'payment',
        title: 'Paiement validé et bus affecté',
        message: `Le paiement pour ${selectedPayment.studentName} a été validé. Bus ${bus.busId}, Groupe ${selectedGroup}.`,
        senderId: 'admin',
        senderType: 'admin'
      });

      toast.success('✅ Paiement validé et élève affecté au bus', {
        duration: 3000,
        style: { background: '#10b981', color: '#fff', fontWeight: '600', padding: '16px', borderRadius: '12px' }
      });

      setShowAssignDialog(false);
      setSelectedPayment(null);
      setSelectedBus('');
      setSelectedGroup('');
      loadData();
    } catch (error) {
      console.error('Error assigning to bus:', error);
      toast.error('Erreur lors de l\'affectation');
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
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard, active: true },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Absences', path: 'AdminAbsences', icon: Calendar },
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

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <DashboardLayout
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={[]}
    >
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800">{paidPayments.length} validés</Badge>
            <Badge className="bg-orange-100 text-orange-800">{pendingPayments.length} en attente</Badge>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'studentName',
              label: 'Élève',
              render: (v, p) => (
                <div>
                  <p className="font-medium">{v}</p>
                  <p className="text-xs text-gray-500">{p.studentClass}</p>
                </div>
              )
            },
            { key: 'tutorName', label: 'Tuteur' },
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
              key: 'amount',
              label: 'Montant',
              render: (v) => <span className="font-semibold text-amber-600">{v} DH</span>
            },
            {
              key: 'status',
              label: 'Statut',
              render: (v) => (
                <Badge className={v === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {v === 'paid' ? 'Payé' : 'En attente'}
                </Badge>
              )
            },
            {
              key: 'paymentDate',
              label: 'Date',
              render: (v) => v ? format(new Date(v), 'd MMM yyyy', { locale: fr }) : '-'
            }
          ]}
          data={payments}
          searchPlaceholder="Rechercher un paiement..."
          filters={[
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'paid', label: 'Payé' },
                { value: 'pending', label: 'En attente' }
              ]
            },
            {
              key: 'subscriptionType',
              label: 'Abonnement',
              options: [
                { value: 'mensuel', label: 'Mensuel' },
                { value: 'annuel', label: 'Annuel' }
              ]
            }
          ]}
          actions={(payment) => (
            payment.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedPayment(payment);
                  setShowAssignDialog(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Valider
              </Button>
            )
          )}
          emptyMessage="Aucun paiement enregistré"
        />
      </div>

      {/* Assign Bus Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le paiement et affecter au bus</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-semibold">{selectedPayment.studentName}</h4>
                <p className="text-sm text-gray-600">Classe: {selectedPayment.studentClass}</p>
                <p className="text-sm font-semibold text-green-700 mt-2">
                  Montant payé: {selectedPayment.amount} DH
                </p>
              </div>

              <div className="space-y-2">
                <Label>Affecter au bus</Label>
                <Select value={selectedBus} onValueChange={setSelectedBus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.filter(b => b.status === 'en_service').map(bus => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.busId} (Capacité: {bus.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Groupe</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Groupe A (07h00-07h30 / 16h30-17h00)</SelectItem>
                    <SelectItem value="B">Groupe B (07h30-08h00 / 17h30-18h00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={assignToBus}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                disabled={submitting || !selectedBus || !selectedGroup}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Valider et affecter
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}