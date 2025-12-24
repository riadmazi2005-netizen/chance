import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { mockData } from '@/services/mockDataService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from '@/components/ui/DataTable';
import { 
  ShieldCheck, Users, Bus, MapPin, CreditCard, AlertTriangle,
  Bell, FileText, UserCog, Loader2, BarChart3, Calendar, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminAbsences() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBus, setSelectedBus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');

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
      const [attendanceRecords, studentsData, busesData] = await Promise.all([
        base44.entities.Attendance.list(),
        base44.entities.Student.filter({ status: 'approved' }),
        base44.entities.Bus.list()
      ]);

      setAttendanceData(attendanceRecords);
      setStudents(studentsData);
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
    { label: 'Élèves', path: 'AdminStudents', icon: Users },
    { label: 'Bus', path: 'AdminBuses', icon: Bus },
    { label: 'Trajets', path: 'AdminRoutes', icon: MapPin },
    { label: 'Chauffeurs', path: 'AdminDrivers', icon: UserCog },
    { label: 'Responsables', path: 'AdminSupervisors', icon: UserCog },
    { label: 'Paiements', path: 'AdminPayments', icon: CreditCard },
    { label: 'Accidents', path: 'AdminAccidents', icon: AlertTriangle },
    { label: 'Absences', path: 'AdminAbsences', icon: Calendar, active: true },
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

  // Filter attendance based on selections
  let filteredAttendance = attendanceData.filter(a => a.status === 'absent');
  
  if (selectedDate) {
    filteredAttendance = filteredAttendance.filter(a => a.date === selectedDate);
  }
  
  if (selectedBus !== 'all') {
    filteredAttendance = filteredAttendance.filter(a => a.busId === selectedBus);
  }
  
  if (selectedGroup !== 'all') {
    filteredAttendance = filteredAttendance.filter(a => a.busGroup === selectedGroup);
  }

  // Enrich with student data
  const enrichedAbsences = filteredAttendance.map(absence => {
    const student = students.find(s => s.id === absence.studentId);
    const bus = buses.find(b => b.id === absence.busId);
    return {
      ...absence,
      studentName: student ? `${student.firstName} ${student.lastName}` : '-',
      studentClass: student?.class,
      studentGender: student?.gender,
      busName: bus?.busId || '-'
    };
  }).filter(a => {
    if (selectedGender !== 'all' && a.studentGender !== selectedGender) {
      return false;
    }
    return true;
  });

  // Statistics for most absent students
  const studentAbsenceCounts = {};
  attendanceData.filter(a => a.status === 'absent').forEach(absence => {
    studentAbsenceCounts[absence.studentId] = (studentAbsenceCounts[absence.studentId] || 0) + 1;
  });

  const mostAbsentStudents = Object.entries(studentAbsenceCounts)
    .map(([studentId, count]) => {
      const student = students.find(s => s.id === studentId);
      return {
        name: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
        absences: count,
        class: student?.class
      };
    })
    .sort((a, b) => b.absences - a.absences)
    .slice(0, 10);

  // Statistics for most present students (least absences)
  const allStudentIds = students.map(s => s.id);
  const presentStudents = allStudentIds
    .map(id => {
      const student = students.find(s => s.id === id);
      const absenceCount = studentAbsenceCounts[id] || 0;
      return {
        name: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
        absences: absenceCount,
        class: student?.class
      };
    })
    .sort((a, b) => a.absences - b.absences)
    .slice(0, 10);

  return (
    <DashboardLayout
      userType="Espace Administrateur"
      userName={currentUser?.fullName || 'Administrateur'}
      menuItems={menuItems}
      notifications={[]}
    >
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historique & Statistiques des Absences</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{attendanceData.filter(a => a.status === 'absent').length}</p>
              <p className="text-sm text-gray-500">Total Absences</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{attendanceData.filter(a => a.status === 'present').length}</p>
              <p className="text-sm text-gray-500">Total Présences</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{enrichedAbsences.length}</p>
              <p className="text-sm text-gray-500">Résultat Filtré</p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Top 10 Élèves les Plus Absents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostAbsentStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} />
                  <Tooltip />
                  <Bar dataKey="absences" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Users className="w-5 h-5" />
                Top 10 Élèves les Plus Présents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={presentStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} />
                  <Tooltip />
                  <Bar dataKey="absences" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-amber-600" />
              Filtres Avancés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bus</label>
                <Select value={selectedBus} onValueChange={setSelectedBus}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les bus</SelectItem>
                    {buses.map(bus => (
                      <SelectItem key={bus.id} value={bus.id}>{bus.busId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Groupe</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    <SelectItem value="A">Groupe A</SelectItem>
                    <SelectItem value="B">Groupe B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sexe</label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="male">Garçon</SelectItem>
                    <SelectItem value="female">Fille</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absence History Table */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Historique des Absences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  key: 'date',
                  label: 'Date',
                  render: (v) => new Date(v).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                },
                {
                  key: 'studentName',
                  label: 'Élève',
                  render: (v, item) => (
                    <div>
                      <p className="font-medium">{v}</p>
                      <p className="text-xs text-gray-500">{item.studentClass}</p>
                    </div>
                  )
                },
                {
                  key: 'studentGender',
                  label: 'Sexe',
                  render: (v) => (
                    <Badge className={v === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}>
                      {v === 'male' ? 'Garçon' : 'Fille'}
                    </Badge>
                  )
                },
                {
                  key: 'busName',
                  label: 'Bus'
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
                  key: 'period',
                  label: 'Période',
                  render: (v) => v === 'morning' ? 'Matin' : 'Soir'
                },
                {
                  key: 'status',
                  label: 'Statut',
                  render: (v) => (
                    <Badge className="bg-red-100 text-red-800">Absent</Badge>
                  )
                }
              ]}
              data={enrichedAbsences.sort((a, b) => new Date(b.date) - new Date(a.date))}
              searchPlaceholder="Rechercher un élève..."
              emptyMessage="Aucune absence trouvée"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}