import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserCog } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { supervisorApi } from  '@/services/apiService';

export default function SupervisorLogin() {
  const navigate = useNavigate();

  const handleLogin = async ({ identifier, password }) => {
    const supervisors = await supervisorApi.entities.Supervisor.list();
    
    const supervisor = supervisors.find(s => 
      (s.email === identifier || s.phone === identifier) && s.password === password
    );

    if (!supervisor) {
      throw new Error('Email/téléphone ou mot de passe incorrect');
    }

    localStorage.setItem('currentUser', JSON.stringify({ ...supervisor, type: 'supervisor' }));
    navigate(createPageUrl('SupervisorDashboard'));
  };

  return (
    <LoginForm
      title="Espace Responsable Bus"
      description="Connectez-vous pour gérer votre bus et vos élèves"
      icon={UserCog}
      onSubmit={handleLogin}
    />
  );
}