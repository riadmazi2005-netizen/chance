import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { tutorApi } from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Bus, PlusCircle, FileText, Bell, CheckCircle, 
  Clock, XCircle, CreditCard, User, Phone, MapPin, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CLASSES = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'];

export default function TutorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [buses, setBuses] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    class: '',
    age: '',
    gender: 'male',
    zone: '',
    transportType: 'aller-retour',
    subscriptionType: 'mensuel',
    parentRelation: ''
  });

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
      const [studentsData, notificationsData, busesData, paymentsData] = await Promise.all([
        tutorApi.entities.Student.filter({ tutorId }),
        tutorApi.entities.Notification.filter({ recipientId: tutorId, recipientType: 'tutor' }),
        tutorApi.entities.Bus.list(),
        tutorApi.entities.Payment.list()
      ]);
      
      // Attach payment info to students
      const studentsWithPayments = studentsData.map(s => {
        const payment = paymentsData.find(p => p.studentId === s.id);
        return { ...s, payment };
      });
      
      setStudents(studentsWithPayments);
      setNotifications(notificationsData);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await tutorApi.entities.Student.create({
        ...newStudent,
        age: parseInt(newStudent.age),
        tutorId: currentUser.id,
        status: 'pending',
        paymentStatus: 'unpaid',
        absenceCount: 0
      });

      // Create notification for admin
      await tutorApi.entities.Notification.create({
        recipientId: 'admin',
        recipientType: 'admin',
        type: 'general',
        title: 'Nouvelle demande d\'inscription',
        message: `${currentUser.firstName} ${currentUser.lastName} a soumis une demande d'inscription pour ${newStudent.firstName} ${newStudent.lastName}`,
        senderId: currentUser.id,
        senderType: 'tutor'
      });

      setShowAddStudent(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        class: '',
        age: '',
        gender: 'male',
        zone: '',
        transportType: 'aller-retour',
        subscriptionType: 'mensuel',
        parentRelation: ''
      });
      loadData(currentUser.id);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (verificationCode !== '123456') {
      alert('Code de vérification incorrect');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate family discount
      const allStudents = await tutorApi.entities.Student.list();
      const tutorStudents = allStudents.filter(s => 
        s.tutorId === currentUser.id && 
        (s.status === 'approved' || s.id === selectedPayment.id)
      );
      
      const studentCount = tutorStudents.length;
      let discountPercentage = 0;
      if (studentCount === 2) discountPercentage = 10;
      else if (studentCount >= 3) discountPercentage = 30;

      // Create payment record with discount
      const baseAmount = selectedPayment.subscriptionType === 'annuel' ? 3000 : 300;
      const discountAmount = (baseAmount * discountPercentage) / 100;
      const finalAmount = baseAmount - discountAmount;

      await tutorApi.entities.Payment.create({
        studentId: selectedPayment.id,
        tutorId: currentUser.id,
        amount: baseAmount,
        discountPercentage,
        discountAmount,
        finalAmount,
        transportType: selectedPayment.transportType,
        subscriptionType: selectedPayment.subscriptionType,
        status: 'pending',
        verificationCode,
        paymentDate: new Date().toISOString().split('T')[0]
      });

      // Update student payment status to paid
      await tutorApi.entities.Student.update(selectedPayment.id, {
        paymentStatus: 'paid'
      });

      // Notify admin about payment
      await tutorApi.entities.Notification.create({
        recipientId: 'admin',
        recipientType: 'admin',
        type: 'payment',
        title: `Paiement effectué - ${currentUser.firstName} ${currentUser.lastName}`,
        message: `Le tuteur ${currentUser.firstName} ${currentUser.lastName} a payé l'inscription de ${selectedPayment.firstName} ${selectedPayment.lastName} (${finalAmount} DH). Veuillez affecter l'élève à un bus.`,
        senderId: currentUser.id,
        senderType: 'tutor'
      });

      setShowPayment(false);
      setSelectedPayment(null);
      setVerificationCode('');
      alert('Paiement confirmé ! L\'administrateur va affecter votre enfant à un bus sous peu.');
      loadData(currentUser.id);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getBusInfo = (busId) => buses.find(b => b.id === busId);

  const getStatusBadge = (status) => {
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
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const menuItems = [
    { label: 'Tableau de bord', path: 'TutorDashboard', icon: Users, active: true },
    { label: 'Mes Élèves', path: 'TutorStudents', icon: User },
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

  const approvedStudents = students.filter(s => s.status === 'approved');
  const pendingStudents = students.filter(s => s.status === 'pending');
  const paidStudents = students.filter(s => s.paymentStatus === 'paid');
  
  // Calculate discount info
  const discountPercentage = approvedStudents.length === 2 ? 10 : approvedStudents.length >= 3 ? 30 : 0;
  const totalPayments = students.reduce((sum, s) => sum + (s.payment?.finalAmount || 0), 0);

  return (
    <DashboardLayout
      userType="Espace Tuteur"
      userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
      menuItems={menuItems}
      notifications={notifications}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Bienvenue, {currentUser?.firstName} !
            </h1>
            <p className="text-gray-500 mt-1">Gérez les inscriptions de vos enfants</p>
          </div>
          <Button 
            onClick={() => setShowAddStudent(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-lg"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Inscrire un élève
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Élèves"
            value={students.length}
            icon={Users}
            color="amber"
          />
          <StatCard
            title="Inscriptions Validées"
            value={approvedStudents.length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="En Attente"
            value={pendingStudents.length}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Paiements Effectués"
            value={paidStudents.length}
            icon={CreditCard}
            color="purple"
          />
        </div>

        {/* Family Discount Banner */}
        {discountPercentage > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Réduction familiale appliquée !</h3>
                  <p className="text-sm text-green-700">
                    {approvedStudents.length} élèves inscrits • <span className="font-semibold">-{discountPercentage}%</span> sur chaque paiement
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600">Économie totale</p>
                <p className="text-2xl font-bold text-green-700">
                  {students.reduce((sum, s) => sum + (s.payment?.discountAmount || 0), 0).toFixed(0)} DH
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Students List */}
        <Card className="border-amber-100 shadow-lg">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Mes Élèves
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {students.length > 0 ? (
              <div className="divide-y divide-amber-50">
                {students.map((student, idx) => {
                  const bus = getBusInfo(student.busId);
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 sm:p-6 hover:bg-amber-50/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">Classe: {student.class}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getStatusBadge(student.status)}
                              {student.status === 'approved' && (
                                <Badge className={student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                  {student.paymentStatus === 'paid' ? 'Payé' : 'Non payé'}
                                </Badge>
                              )}
                              {student.busGroup && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700">
                                  Groupe {student.busGroup}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          {student.status === 'approved' && bus && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium text-gray-700">{bus.busId}</span>
                            </div>
                          )}
                          
                          {student.status === 'approved' && student.paymentStatus === 'unpaid' && (
                            <Button
                              onClick={() => {
                                setSelectedPayment(student);
                                setShowPayment(true);
                              }}
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Payer
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Invoice Preview for approved students */}
                      {student.status === 'approved' && student.payment && (
                        <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                          <h4 className="font-semibold text-gray-700 mb-2">Facture</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span className="font-medium">{student.transportType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Abonnement:</span>
                              <span className="font-medium">{student.subscriptionType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Montant base:</span>
                              <span className="font-medium">{student.payment.amount} DH</span>
                            </div>
                            {student.payment.discountPercentage > 0 && (
                              <>
                                <div className="flex justify-between text-green-600">
                                  <span>Réduction familiale ({student.payment.discountPercentage}%):</span>
                                  <span className="font-semibold">-{student.payment.discountAmount} DH</span>
                                </div>
                                <div className="pt-2 border-t border-amber-200 flex justify-between">
                                  <span className="font-semibold text-gray-700">Montant final:</span>
                                  <span className="font-bold text-amber-600">{student.payment.finalAmount} DH</span>
                                </div>
                              </>
                            )}
                            {student.payment.discountPercentage === 0 && (
                              <div className="pt-2 border-t border-amber-200 flex justify-between">
                                <span className="font-semibold text-gray-700">Montant:</span>
                                <span className="font-bold text-amber-600">{student.payment.finalAmount} DH</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun élève inscrit</p>
                <Button 
                  onClick={() => setShowAddStudent(true)}
                  variant="link"
                  className="text-amber-600"
                >
                  Inscrire votre premier élève
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscrire un élève</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classe</Label>
                <Select
                  value={newStudent.class}
                  onValueChange={(value) => setNewStudent({...newStudent, class: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Âge</Label>
                <Input
                  type="number"
                  value={newStudent.age}
                  onChange={(e) => setNewStudent({...newStudent, age: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select
                  value={newStudent.gender}
                  onValueChange={(value) => setNewStudent({...newStudent, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Garçon</SelectItem>
                    <SelectItem value="female">Fille</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lien de parenté</Label>
                <Input
                  value={newStudent.parentRelation}
                  onChange={(e) => setNewStudent({...newStudent, parentRelation: e.target.value})}
                  placeholder="Père, Mère, etc."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zone</Label>
              <Select
                value={newStudent.zone}
                onValueChange={(value) => setNewStudent({...newStudent, zone: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la zone" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de transport</Label>
                <Select
                  value={newStudent.transportType}
                  onValueChange={(value) => setNewStudent({...newStudent, transportType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aller">Aller</SelectItem>
                    <SelectItem value="retour">Retour</SelectItem>
                    <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Abonnement</Label>
                <Select
                  value={newStudent.subscriptionType}
                  onValueChange={(value) => setNewStudent({...newStudent, subscriptionType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuel">Mensuel (300 DH)</SelectItem>
                    <SelectItem value="annuel">Annuel (3000 DH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer la demande'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-semibold mb-2">Facture pour {selectedPayment.firstName} {selectedPayment.lastName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Classe:</span>
                    <span className="font-medium">{selectedPayment.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{selectedPayment.transportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Abonnement:</span>
                    <span className="font-medium">{selectedPayment.subscriptionType}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200">
                    <span className="font-semibold">Montant:</span>
                    <span className="font-bold text-amber-600">
                      {selectedPayment.subscriptionType === 'annuel' ? '3000' : '300'} DH
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Code de vérification (fourni par l'école après paiement)</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Entrez le code"
                />
                <p className="text-xs text-gray-500">
                  Le code vous sera communiqué par l'école après paiement en présentiel.
                  <br />
                  <span className="text-amber-600">(Pour test: utilisez 123456)</span>
                </p>
              </div>

              <Button 
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                disabled={submitting || !verificationCode}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  'Valider le paiement'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}