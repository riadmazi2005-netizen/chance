import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockData } from '@/services/mockDataService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, Phone, BarChart3
} from 'lucide-react';

const CLASSES = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
const QUARTERS = ['Hay Riad', 'Agdal', 'Hassan', 'Océan', 'Yacoub El Mansour', 'Akkari', 'Souissi'];

export default function AdminStudents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
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
      const [studentsData, busesData, tutorsData] = await Promise.all([
        mockData.entities.Student.filter({ status: 'approved' }),
        mockData.entities.Bus.list(),
        mockData.entities.Tutor.list()
      ]);
      
      const studentsWithDetails = studentsData.map(s => {
        const tutor = tutorsData.find(t => t.id === s.tutorId);
        const bus = busesData.find(b => b.id === s.busId);
        return { 
          ...s, 
          tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : '-', 
          tutorPhone: tutor?.phone,
          tutorCin: tutor?.cin,
          busName: bus?.busId || '-'
        };
      });
      
      setStudents(studentsWithDetails);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'AdminDashboard', icon: ShieldCheck },
    { label: 'Inscriptions', path: 'AdminRegistrations', icon: FileText },
    { label: 'Élèves', path: 'AdminStudents', icon: Users, active: true },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <Badge className="bg-amber-100 text-amber-800">{students.length} élèves</Badge>
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
                    <p className="text-xs text-gray-500">ID: {s.id?.slice(-6)}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'class',
              label: 'Classe',
              render: (v) => <Badge variant="outline" className="border-amber-300">{v}</Badge>
            },
            {
              key: 'gender',
              label: 'Genre',
              render: (v) => v === 'male' ? 'Garçon' : 'Fille'
            },
            { key: 'quarter', label: 'Quartier' },
            {
              key: 'busGroup',
              label: 'Groupe',
              render: (v) => (
                <Badge className={v === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  Groupe {v}
                </Badge>
              )
            },
            { key: 'busName', label: 'Bus' },
            {
              key: 'tutorName',
              label: 'Tuteur',
              render: (v, s) => (
                <div>
                  <p className="text-sm">{v}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {s.tutorPhone}
                  </p>
                  <p className="text-xs text-gray-400">CIN: {s.tutorCin}</p>
                </div>
              )
            },
            {
              key: 'absenceCount',
              label: 'Absences',
              render: (v) => (
                <Badge variant="outline" className={v > 5 ? 'border-red-300 text-red-700' : 'border-gray-300'}>
                  {v || 0}
                </Badge>
              )
            },
            {
              key: 'paymentStatus',
              label: 'Paiement',
              render: (v) => (
                <Badge className={v === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {v === 'paid' ? 'Payé' : 'Non payé'}
                </Badge>
              )
            }
          ]}
          data={students}
          searchPlaceholder="Rechercher par nom, classe, quartier..."
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
              label: 'Genre',
              options: [
                { value: 'male', label: 'Garçon' },
                { value: 'female', label: 'Fille' }
              ]
            },
            {
              key: 'class',
              label: 'Classe',
              options: CLASSES.map(c => ({ value: c, label: c }))
            },
            {
              key: 'quarter',
              label: 'Quartier',
              options: QUARTERS.map(q => ({ value: q, label: q }))
            }
          ]}
          emptyMessage="Aucun élève inscrit"
        />
      </div>
    </DashboardLayout>
  );
}