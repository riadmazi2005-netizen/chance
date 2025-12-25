import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Bus, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const spaces = [
    {
      title: 'Espace Tuteur',
      description: 'Gérez les inscriptions de vos enfants et suivez leur transport',
      icon: Users,
      path: 'TutorLogin',
      gradient: 'from-amber-400 to-yellow-500'
    },
    {
      title: 'Espace Responsable Bus',
      description: 'Supervisez les élèves et gérez les groupes de transport',
      icon: UserCog,
      path: 'SupervisorLogin',
      gradient: 'from-yellow-400 to-amber-500'
    },
    {
      title: 'Espace Chauffeur',
      description: 'Consultez vos trajets et la liste des élèves',
      icon: Bus,
      path: 'DriverLogin',
      gradient: 'from-amber-500 to-yellow-600'
    },
    {
      title: 'Espace Administrateur',
      description: 'Gestion complète du système de transport scolaire',
      icon: ShieldCheck,
      path: 'AdminLogin',
      gradient: 'from-yellow-500 to-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-300 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300 rounded-full blur-3xl opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo/Bus Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-32 h-32 mb-8 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl rotate-6 shadow-2xl" />
              <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                <Bus className="w-16 h-16 text-amber-500" />
              </div>
            </motion.div>

            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4">
              Mohammed 5{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">
                School Bus
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 font-light italic mb-12">
              "Votre service est notre priorité"
            </p>

            {/* School Bus Image */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative max-w-2xl mx-auto mb-16"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-amber-100 to-transparent rounded-3xl" />
              <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6949a4ae562ce218e6ca0074/46a0f0e16_image.png" 
              alt="School Bus"
                className="w-full h-64 sm:h-80 object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <p className="text-amber-700 font-semibold">Transport scolaire sécurisé pour l'École Mohammed V</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Space Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {spaces.map((space, index) => (
              <motion.div
                key={space.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <Link to={createPageUrl(space.path)}>
                  <div className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-amber-100 overflow-hidden h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${space.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${space.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <space.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {space.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {space.description}
                    </p>

                    <div className="mt-4 flex items-center text-amber-500 font-medium text-sm group-hover:text-amber-600">
                      <span>Accéder</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-500 to-yellow-500 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white font-medium">
            © 2025 Mohammed 5 School Bus 
          </p>
          <p className="text-amber-100 text-sm mt-2">
            Système de gestion du transport scolaire
          </p>
        </div>
      </footer>
    </div>
  );
}