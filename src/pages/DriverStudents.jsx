import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/services/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { Bus, Users, Bell, Loader2, Phone } from 'lucide-react';

const CLASSES = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
const QUARTERS = ['Hay Riad', 'Agdal', 'Hassan', 'Océan', 'Yacoub El Mansour', 'Akkari', 'Souissi'];

export default function DriverStudents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'driver') {
      navigate(createPageUrl('DriverLogin'));
      return;
    }
    setCurrentUser(user);
    loadData(user);
  }, []);

  const loadData = async (user) => {
    try {
      const buses = await mockApi.entities.Bus.filter({ driverId: user.id });
      const myBus = buses[0];
      setBus(myBus);

      if (myBus) {
        const allStudents = await mockApi.entities.Student.filter({ busId: myBus.id, status: 'approved' });
        const tutors = await mockApi.entities.Tutor.list();
        const studentsWithTutors = allStudents.map(s => {
          const tutor = tutors.find(t => t.id === s.tutorId);
          return { ...s, tutorPhone: tutor?.phone };
        });
        setStudents(studentsWithTutors);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'DriverDashboard', icon: Bus },
    { label: 'Mes Élèves', path: 'DriverStudents', icon: Users, active: true },
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
      notifications={[]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Élèves</h1>
          <Badge className="bg-amber-100 text-amber-800">{bus?.busId || 'Aucun bus'}</Badge>
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
              label: 'Sexe',
              render: (v) => v === 'male' ? 'Garçon' : 'Fille'
            },
            { key: 'quarter', label: 'Quartier' },
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
              render: (v) => (
                <Badge variant="outline" className={v > 3 ? 'border-red-300 text-red-700' : 'border-gray-300'}>
                  {v || 0}
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
              label: 'Sexe',
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
          emptyMessage="Aucun élève dans ce bus"
        />
      </div>
    </DashboardLayout>
  );
}