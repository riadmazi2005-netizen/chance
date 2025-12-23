import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockData } from '@/services/mockDataService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminPayments() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [paymentsData, studentsData, tutorsData] = await Promise.all([
        mockData.entities.Payment.list(),
        mockData.entities.Student.list(),
        mockData.entities.Tutor.list()
      ]);
      
      const paymentsWithDetails = paymentsData.map(p => {
        const student = studentsData.find(s => s.id === p.studentId);
        const tutor = tutorsData.find(t => t.id === p.tutorId);
        return { 
          ...p, 
          studentName: student ? `${student.firstName} ${student.lastName}` : '-',
          studentClass: student?.class,
          tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : '-'
        };
      });
      
      setPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
          emptyMessage="Aucun paiement enregistré"
        />
      </div>
    </DashboardLayout>
  );
}