import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import apiService from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Users, Bell, Loader2, Phone, Edit, Save } from 'lucide-react';

const CLASSES = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
const QUARTERS = ['Hay Riad', 'Agdal', 'Hassan', 'Océan', 'Yacoub El Mansour', 'Akkari', 'Souissi'];

export default function SupervisorStudents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
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
      const buses = await apiService.entities.Bus.filter({ supervisorId: user.id });
      const myBus = buses[0];
      setBus(myBus);

      if (myBus) {
        const allStudents = await apiService.entities.Student.filter({ busId: myBus.id, status: 'approved' });
        const tutors = await apiService.entities.Tutor.list();
        const studentsWithTutors = allStudents.map(s => {
          const tutor = tutors.find(t => t.id === s.tutorId);
          return { ...s, tutorPhone: tutor?.phone, tutorName: `${tutor?.firstName} ${tutor?.lastName}` };
        });
        setStudents(studentsWithTutors);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    setSubmitting(true);
    try {
      await apiService.entities.Student.update(selectedStudent.id, {
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        class: selectedStudent.class,
        quarter: selectedStudent.quarter,
        busGroup: selectedStudent.busGroup
      });
      setShowEditDialog(false);
      loadData(currentUser);
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'SupervisorDashboard', icon: UserCog },
    { label: 'Élèves', path: 'SupervisorStudents', icon: Users, active: true },
    { label: 'Notifications', path: 'SupervisorNotifications', icon: Bell },
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
      userType="Espace Responsable Bus"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={[]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
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
                  Groupe {v}
                </Badge>
              )
            },
            {
              key: 'tutorPhone',
              label: 'Tél. Tuteur',
              render: (v, s) => (
                <div>
                  <p className="text-sm">{s.tutorName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {v || '-'}
                  </p>
                </div>
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
          searchPlaceholder="Rechercher par nom, prénom, classe..."
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
          actions={(student) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedStudent(student);
                setShowEditDialog(true);
              }}
              className="border-amber-300 text-amber-700"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          emptyMessage="Aucun élève dans ce bus"
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les informations de l'élève</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={selectedStudent.firstName}
                    onChange={(e) => setSelectedStudent({...selectedStudent, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={selectedStudent.lastName}
                    onChange={(e) => setSelectedStudent({...selectedStudent, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={selectedStudent.class}
                    onValueChange={(v) => setSelectedStudent({...selectedStudent, class: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Groupe</Label>
                  <Select
                    value={selectedStudent.busGroup}
                    onValueChange={(v) => setSelectedStudent({...selectedStudent, busGroup: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Groupe A</SelectItem>
                      <SelectItem value="B">Groupe B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quartier</Label>
                <Select
                  value={selectedStudent.quarter}
                  onValueChange={(v) => setSelectedStudent({...selectedStudent, quarter: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map(q => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleEditStudent}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}