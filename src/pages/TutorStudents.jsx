import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import apiService from '@/services/apiService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Bell, FileText, Loader2, Bus, MapPin, UserPlus, X, Send } from 'lucide-react';

export default function TutorStudents() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    class: '',
    age: '',
    gender: 'Fille',
    parentRelation: '',
    neighborhood: '',
    transportType: 'Aller-Retour',
    subscription: 'Mensuel (300 DH)'
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
      const [studentsData, busesData] = await Promise.all([
        apiService.entities.Student.filter({ tutorId }),
        apiService.entities.Bus.list()
      ]);
      setStudents(studentsData);
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const studentData = {
        ...formData,
        age: parseInt(formData.age),
        tutorId: currentUser.id,
        status: 'pending',
        paymentStatus: 'unpaid'
      };

      await mockApi.entities.Student.create(studentData);
      
      // Create payment record
      const amount = formData.subscription.includes('300') ? 300 : 2500;
      const subscriptionType = formData.subscription.includes('Mensuel') ? 'mensuel' : 'annuel';
      
      await mockApi.entities.Payment.create({
        studentId: studentData.id,
        tutorId: currentUser.id,
        amount,
        subscriptionType,
        transportType: formData.transportType,
        status: 'pending'
      });

      alert('Demande d\'inscription envoyée avec succès!');
      setShowRegistrationDialog(false);
      resetForm();
      loadData(currentUser.id);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      class: '',
      age: '',
      gender: 'Fille',
      parentRelation: '',
      neighborhood: '',
      transportType: 'Aller-Retour',
      subscription: 'Mensuel (300 DH)'
    });
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
      key: 'age',
      label: 'Âge',
      render: (value) => <span>{value} ans</span>
    },
    {
      key: 'gender',
      label: 'Genre',
      render: (value) => <span className="text-sm text-gray-600">{value}</span>
    },
    {
      key: 'neighborhood',
      label: 'Quartier',
      render: (value) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Élèves</h1>
          <Button
            onClick={() => setShowRegistrationDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nouvelle inscription
          </Button>
        </div>

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

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-xl p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Inscrire un élève</h2>
            <button
              onClick={() => setShowRegistrationDialog(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Prénom & Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Prénom</Label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Nom</Label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Classe & Âge */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Classe</Label>
                <Select value={formData.class} onValueChange={(v) => handleSelectChange('class', v)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1AP">1AP</SelectItem>
                    <SelectItem value="2AP">2AP</SelectItem>
                    <SelectItem value="3AP">3AP</SelectItem>
                    <SelectItem value="4AP">4AP</SelectItem>
                    <SelectItem value="5AP">5AP</SelectItem>
                    <SelectItem value="6AP">6AP</SelectItem>
                    <SelectItem value="1AC">1AC</SelectItem>
                    <SelectItem value="2AC">2AC</SelectItem>
                    <SelectItem value="3AC">3AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Âge</Label>
                <Input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Genre</Label>
              <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fille">Fille</SelectItem>
                  <SelectItem value="Garçon">Garçon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lien de parenté */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Lien de parenté</Label>
              <Input
                name="parentRelation"
                value={formData.parentRelation}
                onChange={handleChange}
                placeholder="Père, Mère, etc."
                className="border-gray-300 focus:border-amber-500"
              />
            </div>

            {/* Quartier */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Quartier</Label>
              <Select value={formData.neighborhood} onValueChange={(v) => handleSelectChange('neighborhood', v)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Sélectionner le quartier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hay Riad">Hay Riad</SelectItem>
                  <SelectItem value="Agdal">Agdal</SelectItem>
                  <SelectItem value="Souissi">Souissi</SelectItem>
                  <SelectItem value="Aviation">Aviation</SelectItem>
                  <SelectItem value="Hay Nahda">Hay Nahda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type de transport & Abonnement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Type de transport</Label>
                <Select value={formData.transportType} onValueChange={(v) => handleSelectChange('transportType', v)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aller-Retour">Aller-Retour</SelectItem>
                    <SelectItem value="Aller uniquement">Aller uniquement</SelectItem>
                    <SelectItem value="Retour uniquement">Retour uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Abonnement</Label>
                <Select value={formData.subscription} onValueChange={(v) => handleSelectChange('subscription', v)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensuel (300 DH)">Mensuel (300 DH)</SelectItem>
                    <SelectItem value="Annuel (2500 DH)">Annuel (2500 DH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full py-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}