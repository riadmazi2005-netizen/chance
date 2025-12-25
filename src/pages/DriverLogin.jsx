import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bus } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import apiService from '@/services/apiService';

export default function DriverLogin() {
  const navigate = useNavigate();

  const handleLogin = async ({ identifier, password }) => {
    const drivers = await apiService.entities.Driver.list();
    
    const driver = drivers.find(d => 
      (d.email === identifier || d.phone === identifier || d.cin === identifier) && d.password === password
    );

    if (!driver) {
      throw new Error('Identifiant ou mot de passe incorrect');
    }

    if (driver.status === 'fired') {
      throw new Error('Votre compte a été désactivé. Contactez l\'administration.');
    }

    localStorage.setItem('currentUser', JSON.stringify({ ...driver, type: 'driver' }));
    navigate(createPageUrl('DriverDashboard'));
  };

  return (
    <LoginForm
      title="Espace Chauffeur"
      description="Connectez-vous pour accéder à vos trajets"
      icon={Bus}
      onSubmit={handleLogin}
      identifierLabel="Email, Téléphone ou CIN"
      identifierPlaceholder="email@example.com, 0600000000 ou AB123456"
    />
  );
}