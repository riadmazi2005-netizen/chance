import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { adminApi } from  '@/services/apiService';

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleLogin = async ({ identifier, password }) => {
    const admins = await adminApi.entities.Admin.list();
    
    // If no admin exists, create default one
    if (admins.length === 0) {
      await adminApi.entities.Admin.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrateur Principal'
      });
      
      if (identifier === 'admin' && password === 'admin123') {
        localStorage.setItem('currentUser', JSON.stringify({ 
          username: 'admin', 
          fullName: 'Administrateur Principal',
          type: 'admin' 
        }));
        navigate(createPageUrl('AdminDashboard'));
        return;
      }
    }
    
    const admin = admins.find(a => a.username === identifier && a.password === password);

    if (!admin) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    localStorage.setItem('currentUser', JSON.stringify({ ...admin, type: 'admin' }));
    navigate(createPageUrl('AdminDashboard'));
  };

  return (
    <LoginForm
      title="Espace Administrateur"
      description="Accès réservé à l'administrateur"
      icon={ShieldCheck}
      onSubmit={handleLogin}
      identifierLabel="Nom d'utilisateur"
      identifierPlaceholder="admin"
    />
  );
}