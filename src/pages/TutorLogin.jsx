import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { tutorApi } from '@/services/apiService';

export default function TutorLogin() {
  const navigate = useNavigate();

  const handleLogin = async ({ identifier, password }) => {
    try {
      // Essayer d'abord avec le backend PHP
      const response = await tutorApi.login(identifier, password);
      
      if (response && response.id) {
        // Succès : stocker la session et rediriger
        localStorage.setItem('currentUser', JSON.stringify({ 
          ...response, 
          type: 'tutor' 
        }));
        navigate(createPageUrl('TutorDashboard'));
        return;
      }
    } catch (backendError) {
      console.log('Backend non disponible, utilisation des données de test:', backendError);
      
      // Fallback : utiliser les données mockées pour la démo
      const tutors = await tutorApi.entities.Tutor.list();
      
      // Trouver le tuteur par email, téléphone ou CIN
      const tutor = tutors.find(t => 
        (t.email === identifier || t.phone === identifier || t.cin === identifier)
      );

      if (!tutor) {
        throw new Error('Email/téléphone ou mot de passe incorrect');
      }

      // Vérifier le mot de passe (en clair pour la démo)
      if (tutor.password !== password) {
        throw new Error('Email/téléphone ou mot de passe incorrect');
      }

      // Vérifier le statut
      if (tutor.status !== 'active') {
        throw new Error('Votre compte est suspendu. Contactez l\'administration.');
      }

      // Stocker la session
      localStorage.setItem('currentUser', JSON.stringify({ 
        ...tutor, 
        type: 'tutor' 
      }));
      
      navigate(createPageUrl('TutorDashboard'));
    }
  };

  return (
    <LoginForm
      title="Espace Tuteur"
      description="Connectez-vous pour gérer le transport de vos enfants"
      icon={Users}
      onSubmit={handleLogin}
      showRegister={true}
      registerPath="TutorRegister"
      identifierLabel="Email, Téléphone ou CIN"
      identifierPlaceholder="email@example.com, 0600000000 ou AB123456"
    />
  );
}