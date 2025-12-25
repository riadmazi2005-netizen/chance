import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { adminApi } from  '@/services/apiService';
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
  const [routes, setRoutes] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState(null);

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
      const [studentsData, busesData, tutorsData, routesData, allStudentsData] = await Promise.all([
        adminApi.entities.Student.filter({ status: 'pending' }),
        adminApi.entities.Bus.list(),
        adminApi.entities.Tutor.list(),
        adminApi.entities.Route.list(),
        adminApi.entities.Student.list()
      ]);
      
      const studentsWithTutors = studentsData.map(s => {
        const tutor = tutorsData.find(t => t.id === s.tutorId);
        return { ...s, tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : '-', tutorPhone: tutor?.phone };
      });
      
      // Calculate bus capacity usage
      const busCapacityMap = {};
      busesData.forEach(bus => {
        const studentsInBus = allStudentsData.filter(s => s.busId === bus.id && s.status === 'approved');
        const route = routesData.find(r => r.busId === bus.id);
        busCapacityMap[bus.id] = {
          used: studentsInBus.length,
          total: bus.capacity,
          available: bus.capacity - studentsInBus.length,
          route: route
        };
      });
      
      setStudents(studentsWithTutors);
      setBuses(busesData.map(b => ({ ...b, capacityInfo: busCapacityMap[b.id] })));
      setRoutes(routesData);
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
      await adminApi.entities.Student.update(selectedStudent.id, {
        status: 'approved'
      });

      // Calculate family discount
      const allStudents = await adminApi.entities.Student.list();
      const tutorStudents = allStudents.filter(s => 
        s.tutorId === selectedStudent.tutorId && 
        (s.status === 'approved' || s.id === selectedStudent.id)
      );
      
      const studentCount = tutorStudents.length;
      let discountPercentage = 0;
      if (studentCount === 2) discountPercentage = 10;
      else if (studentCount >= 3) discountPercentage = 30;

      // Create payment record with discount
      const baseAmount = selectedStudent.subscriptionType === 'annuel' ? 3000 : 300;
      const discountAmount = (baseAmount * discountPercentage) / 100;
      const finalAmount = baseAmount - discountAmount;

      await adminApi.entities.Payment.create({
        studentId: selectedStudent.id,
        tutorId: selectedStudent.tutorId,
        amount: baseAmount,
        discountPercentage,
        discountAmount,
        finalAmount,
        transportType: selectedStudent.transportType,
        subscriptionType: selectedStudent.subscriptionType,
        status: 'pending'
      });

      // Notify tutor
      const discountMessage = discountPercentage > 0 
        ? ` 🎉 Réduction familiale appliquée : -${discountPercentage}% (${discountAmount} DH). Montant à payer : ${finalAmount} DH.`
        : ` Montant à payer : ${finalAmount} DH.`;

      await adminApi.entities.Notification.create({
        recipientId: selectedStudent.tutorId,
        recipientType: 'tutor',
        type: 'validation',
        title: 'Inscription validée !',
        message: `L'inscription de ${selectedStudent.firstName} ${selectedStudent.lastName} a été validée.${discountMessage}`,
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

  const verifyBusCapacity = async (student) => {
    // Find routes that cover this zone
    const relevantRoutes = routes.filter(r => r.zones?.includes(student.zone));
    const relevantBuses = buses.filter(b => b.capacityInfo?.route && relevantRoutes.some(r => r.id === b.capacityInfo.route.id));
    
    setVerifyInfo({
      student,
      relevantBuses,
      relevantRoutes
    });
    setShowVerifyDialog(true);
  };

  const rejectStudent = async (student) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) return;
    
    try {
      await adminApi.entities.Student.update(student.id, { status: 'rejected' });

      await adminApi.entities.Notification.create({
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
            { key: 'zone', label: 'Zone' },
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
                variant="outline"
                onClick={() => verifyBusCapacity(student)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 mr-1" />
                Vérifier
              </Button>
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

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vérification de disponibilité</DialogTitle>
          </DialogHeader>
          
          {verifyInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-semibold text-lg">{verifyInfo.student.firstName} {verifyInfo.student.lastName}</h4>
                <p className="text-sm text-gray-600">Zone: <span className="font-medium">{verifyInfo.student.zone}</span></p>
                <p className="text-sm text-gray-600">Classe: {verifyInfo.student.class}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-600" />
                  Bus disponibles pour cette zone
                </h4>
                
                {verifyInfo.relevantBuses.length > 0 ? (
                  verifyInfo.relevantBuses.map(bus => {
                    const route = bus.capacityInfo?.route;
                    const capacityPercentage = (bus.capacityInfo.used / bus.capacityInfo.total) * 100;
                    
                    return (
                      <div key={bus.id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold text-lg">{bus.busId}</h5>
                            <p className="text-sm text-gray-500">Trajet: {route?.routeId || '-'}</p>
                            <p className="text-xs text-gray-500">Destination: {route?.terminus || '-'}</p>
                          </div>
                          <Badge className={bus.capacityInfo.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {bus.capacityInfo.available > 0 ? 'Places disponibles' : 'Complet'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacité utilisée:</span>
                            <span className="font-semibold">{bus.capacityInfo.used} / {bus.capacityInfo.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                capacityPercentage >= 90 ? 'bg-red-500' : 
                                capacityPercentage >= 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${capacityPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {bus.capacityInfo.available} places restantes
                          </p>
                        </div>

                        {route && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                            <p>🕐 Matin: {route.departureTimeMorning} - {route.arrivalTimeMorning}</p>
                            <p>🕐 Soir: {route.departureTimeEvening} - {route.arrivalTimeEvening}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-xl">
                    <Bus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Aucun bus n'est assigné à cette zone</p>
                    <p className="text-sm text-gray-400 mt-1">Veuillez configurer les trajets dans la section Trajets</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => setShowVerifyDialog(false)}
                className="w-full"
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                <p className="text-sm text-gray-600">Zone: {selectedStudent.zone}</p>
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