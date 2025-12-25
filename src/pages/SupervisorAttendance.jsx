import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supervisorApi } from  '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Users, Bell, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function SupervisorAttendance() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('morning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [todayAttendance, setTodayAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [markedStudents, setMarkedStudents] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.type !== 'supervisor') {
      navigate(createPageUrl('SupervisorLogin'));
      return;
    }
    setCurrentUser(user);
    loadData(user);
  }, [selectedDate, selectedPeriod]);

  const loadData = async (user) => {
    try {
      const buses = await supervisorApi.entities.Bus.filter({ supervisorId: user.id });
      const myBus = buses[0];
      setBus(myBus);

      if (myBus) {
        const allStudents = await supervisorApi.entities.Student.filter({ 
          busId: myBus.id, 
          status: 'approved' 
        });
        
        const tutors = await supervisorApi.entities.Tutor.list();
        const studentsWithTutors = allStudents.map(s => {
          const tutor = tutors.find(t => t.id === s.tutorId);
          return { 
            ...s, 
            tutorPhone: tutor?.phone, 
            tutorName: `${tutor?.firstName} ${tutor?.lastName}`,
            tutorId: tutor?.id
          };
        });
        setStudents(studentsWithTutors);

        // Load attendance for today
        const attendanceRecords = await supervisorApi.entities.Attendance.filter({
          busId: myBus.id,
          date: selectedDate,
          period: selectedPeriod
        });

        const attendanceMap = {};
        attendanceRecords.forEach(record => {
          attendanceMap[record.studentId] = record.status;
        });
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    setSubmitting(true);
    try {
      const student = students.find(s => s.id === studentId);
      
      // Check if attendance already exists
      const existing = await supervisorApi.entities.Attendance.filter({
        studentId,
        busId: bus.id,
        date: selectedDate,
        period: selectedPeriod
      });

      if (existing.length > 0) {
        // Update existing record
        await supervisorApi.entities.Attendance.update(existing[0].id, { status });
      } else {
        // Create new record
        await supervisorApi.entities.Attendance.create({
          studentId,
          busId: bus.id,
          date: selectedDate,
          status,
          markedBy: currentUser.id,
          busGroup: student.busGroup,
          period: selectedPeriod
        });
      }

      // Update local state
      setTodayAttendance(prev => ({ ...prev, [studentId]: status }));

      // If absent, notify tutor and update absence count
      if (status === 'absent') {
        await supervisorApi.entities.Notification.create({
          recipientId: student.tutorId,
          recipientType: 'tutor',
          type: 'absence',
          title: 'Absence de votre enfant',
          message: `${student.firstName} ${student.lastName} a été marqué(e) absent(e) dans le bus ${bus.busId} le ${new Date(selectedDate).toLocaleDateString('fr-FR')} (${selectedPeriod === 'morning' ? 'Matin' : 'Soir'})`,
          senderId: currentUser.id,
          senderType: 'supervisor'
        });

        // Update student absence count
        await supervisorApi.entities.Student.update(studentId, {
          absenceCount: (student.absenceCount || 0) + 1
        });

        toast.success('Absence enregistrée et tuteur notifié', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        });
      } else {
        toast.success('Présence enregistrée', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        });
      }

      loadData(currentUser);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'SupervisorDashboard', icon: UserCog },
    { label: 'Présences', path: 'SupervisorAttendance', icon: CheckCircle, active: true },
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

  const filteredStudents = students.filter(s => 
    s.busGroup === selectedGroup && 
    !todayAttendance[s.id]
  );

  return (
    <DashboardLayout
      userType="Espace Responsable Bus"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={[]}
    >
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Présences</h1>
          <Badge className="bg-amber-100 text-amber-800">Bus {bus?.busId}</Badge>
        </div>

        {/* Date, Period, and Group Selection */}
        <Card className="border-amber-100 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Période</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Matin (Aller)</SelectItem>
                    <SelectItem value="evening">Soir (Retour)</SelectItem>
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
                    <SelectItem value="A">Groupe A</SelectItem>
                    <SelectItem value="B">Groupe B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-500">Total Élèves</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {Object.values(todayAttendance).filter(s => s === 'present').length}
              </p>
              <p className="text-sm text-gray-500">Présents</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {Object.values(todayAttendance).filter(s => s === 'absent').length}
              </p>
              <p className="text-sm text-gray-500">Absents</p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card className={`shadow-lg ${selectedGroup === 'A' ? 'border-blue-200' : 'border-purple-200'}`}>
          <CardHeader className={`border-b ${selectedGroup === 'A' ? 'border-blue-100 bg-blue-50' : 'border-purple-100 bg-purple-50'}`}>
            <CardTitle className="flex items-center justify-between">
              <span className={`flex items-center gap-2 ${selectedGroup === 'A' ? 'text-blue-800' : 'text-purple-800'}`}>
                <Users className="w-5 h-5" />
                Groupe {selectedGroup}
              </span>
              <Badge className={selectedGroup === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                {filteredStudents.length} élèves
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map(student => {
                  const attendanceStatus = todayAttendance[student.id];
                  
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        attendanceStatus === 'present' 
                          ? 'border-green-300 bg-green-50' 
                          : attendanceStatus === 'absent'
                          ? 'border-red-300 bg-red-50'
                          : 'border-amber-200 bg-white hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-500">{student.class}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markAttendance(student.id, 'present')}
                            disabled={submitting}
                            className={`${
                              attendanceStatus === 'present'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Présent
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(student.id, 'absent')}
                            disabled={submitting}
                            className={`${
                              attendanceStatus === 'absent'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucun élève dans ce groupe</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}