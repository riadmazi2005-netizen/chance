import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { tutorApi } from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { Users, User, Bell, FileText, Loader2, Bus, MapPin } from 'lucide-react';

export default function TutorStudents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'tutor') {
      navigate(createPageUrl('TutorLogin'));
      return;
    }
    setCurrentUser(user);
    loadData(user.id);
  }, []);

  const loadData = async (tutorId) => {
    try {
      const [studentsData, busesData] = await Promise.all([
        tutorApi.entities.Student.filter({ tutorId }),
        tutorApi.entities.Bus.list()
      ]);
      setStudents(studentsData);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBusInfo = (busId) => buses.find(b => b.id === busId);

  const columns = [
    {
      key: 'name',
      label: 'Élève',
      render: (_, student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold shadow">
            {student.firstName?.[0]}{student.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
            <p className="text-sm text-gray-500">{student.parentRelation}</p>
          </div>
        </div>
      )
    },
    {
      key: 'class',
      label: 'Classe',
      render: (value) => (
        <Badge variant="outline" className="border-amber-300 text-amber-700">{value}</Badge>
      )
    },
    {
      key: 'busGroup',
      label: 'Groupe',
      render: (value) => value ? (
        <Badge className="bg-blue-100 text-blue-800">Groupe {value}</Badge>
      ) : '-'
    },
    {
      key: 'busId',
      label: 'Bus',
      render: (value) => {
        const bus = getBusInfo(value);
        return bus ? (
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-gray-400" />
            <span>{bus.busId}</span>
          </div>
        ) : '-';
      }
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value) => {
        const styles = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800'
        };
        const labels = {
          pending: 'En attente',
          approved: 'Validée',
          rejected: 'Refusée'
        };
        return <Badge className={styles[value]}>{labels[value]}</Badge>;
      }
    },
    {
      key: 'paymentStatus',
      label: 'Paiement',
      render: (value, student) => student.status === 'approved' ? (
        <Badge className={value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
          {value === 'paid' ? 'Payé' : 'Non payé'}
        </Badge>
      ) : '-'
    }
  ];

  const menuItems = [
    { label: 'Tableau de bord', path: 'TutorDashboard', icon: Users },
    { label: 'Mes Élèves', path: 'TutorStudents', icon: User, active: true },
    { label: 'Notifications', path: 'TutorNotifications', icon: Bell },
    { label: 'Mon Profil', path: 'TutorProfile', icon: FileText },
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
      userType="Espace Tuteur"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={[]}
    >
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Élèves</h1>

        <DataTable
          columns={columns}
          data={students}
          searchPlaceholder="Rechercher un élève..."
          filters={[
            {
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'pending', label: 'En attente' },
                { value: 'approved', label: 'Validée' },
                { value: 'rejected', label: 'Refusée' }
              ]
            },
            {
              key: 'class',
              label: 'Classe',
              options: ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'].map(c => ({
                value: c, label: c
              }))
            }
          ]}
          emptyMessage="Aucun élève inscrit"
        />
      </div>
    </DashboardLayout>
  );
}