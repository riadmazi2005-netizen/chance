// src/services/apiService.js

<<<<<<< Updated upstream
const API_BASE_URL = 'http://localhost/transport_scolaire/backend/api';
=======
const API_BASE_URL = 'http://localhost/backend';
>>>>>>> Stashed changes

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Helper pour les requêtes HTTP avec gestion d'erreurs améliorée
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('🔄 API Request:', url, options.method || 'GET');
      
      const response = await fetch(url, config);
      
      // Essayer de parser le JSON
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('❌ Erreur de parsing JSON:', e);
        throw new Error('Réponse du serveur invalide');
      }

      console.log('✅ API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP ${response.status}`);
      }

      // Retourner directement les données si elles existent, sinon la réponse complète
      return data.data ? data : data;
    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Vérifier si c'est une erreur réseau
      if (error.message === 'Failed to fetch') {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que XAMPP est démarré et que le backend est accessible.');
      }
      
      throw error;
    }
  }

  // Méthodes CRUD génériques
  entities = {
    // Admin
    Admin: {
      list: () => this.request('/admin/admins.php', { method: 'GET' }),
      create: (data) => this.request('/admin/admins.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/admins.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/admins.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Students
    Student: {
      list: () => this.request('/admin/students.php', { method: 'GET' }),
      filter: (params) => this.request('/admin/students.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/students.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/students.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/students.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Tutors
    Tutor: {
      list: () => this.request('/admin/tutors.php', { method: 'GET' }),
      filter: (params) => this.request('/admin/tutors.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/tutors.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/tutors.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/tutors.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Buses
    Bus: {
      list: () => this.request('/admin/buses.php', { method: 'GET' }),
      create: (data) => this.request('/admin/buses.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/buses.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/buses.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Routes
    Route: {
      list: () => this.request('/admin/routes.php', { method: 'GET' }),
      create: (data) => this.request('/admin/routes.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/routes.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/routes.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Drivers
    Driver: {
      list: () => this.request('/admin/drivers.php', { method: 'GET' }),
      create: (data) => this.request('/admin/drivers.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/drivers.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/drivers.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Supervisors
    Supervisor: {
      list: () => this.request('/admin/supervisors.php', { method: 'GET' }),
      create: (data) => this.request('/admin/supervisors.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/supervisors.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/supervisors.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Payments
    Payment: {
      list: () => this.request('/admin/payments.php', { method: 'GET' }),
      filter: (params) => this.request('/admin/payments.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/payments.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/payments.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/payments.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Accidents
    Accident: {
      list: () => this.request('/admin/accidents.php', { method: 'GET' }),
      create: (data) => this.request('/admin/accidents.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/accidents.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      delete: (id) => this.request(`/admin/accidents.php?id=${id}`, {
        method: 'DELETE'
      })
    },

    // Attendance (Absences)
    Attendance: {
      list: () => this.request('/admin/absences.php', { method: 'GET' }),
      stats: () => this.request('/admin/absences.php?stats=true', { method: 'GET' }),
      filter: (params) => this.request('/admin/absences.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/absences.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/absences.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      })
    },

    // Notifications
    Notification: {
      list: () => this.request('/admin/notifications.php', { method: 'GET' }),
      filter: (params) => this.request('/admin/notifications.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/notifications.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/notifications.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      }),
      markAsRead: (id) => this.request('/admin/notifications.php', {
        method: 'PUT',
        body: JSON.stringify({ id, is_read: true })
      })
    },

    // Raise Requests
    RaiseRequest: {
      list: () => this.request('/admin/raise_requests.php', { method: 'GET' }),
      filter: (params) => this.request('/admin/raise_requests.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'filter', ...params })
      }),
      create: (data) => this.request('/admin/raise_requests.php', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request('/admin/raise_requests.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      })
    }
  };

  // Authentication
  auth = {
    adminLogin: (credentials) => this.request('/auth/admin_login.php', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    tutorLogin: (credentials) => this.request('/auth/tutor_login.php', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    driverLogin: (credentials) => this.request('/auth/driver_login.php', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    supervisorLogin: (credentials) => this.request('/auth/supervisor_login.php', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    tutorRegister: (data) => this.request('/tutor/register.php', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  };

  // Dashboard Stats
  stats = {
    admin: () => this.request('/admin/dashboard.php', { method: 'GET' }),
    tutor: (tutorId) => this.request(`/tutor/dashboard.php?tutor_id=${tutorId}`, { method: 'GET' }),
    driver: (driverId) => this.request(`/driver/dashboard.php?driver_id=${driverId}`, { method: 'GET' }),
    supervisor: (supervisorId) => this.request(`/supervisor/dashboard.php?supervisor_id=${supervisorId}`, { method: 'GET' })
  };
}
// Export une instance singleton
export const apiService = new ApiService();
export default apiService;
/**
 * API Tuteur
 */
export const tutorApi = {
  // Authentification
  login: async (identifier, password) => {
    return await apiRequest('/tutor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  register: async (userData) => {
    console.log('📝 Registering tutor:', userData);
    return await apiRequest('/tutor_register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Dashboard
  getDashboard: async (tutorId) => {
    return await apiRequest(`/tutor_dashboard.php?tutor_id=${tutorId}`);
  },

  // Élèves
  getStudents: async (tutorId) => {
    return await apiRequest(`/tutor_students.php?tutor_id=${tutorId}`);
  },

  createStudent: async (studentData) => {
    return await apiRequest('/tutor_students.php', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: async (studentId, tutorId) => {
    return await apiRequest(`/tutor_students.php?student_id=${studentId}&tutor_id=${tutorId}`, {
      method: 'DELETE',
    });
  },

  // Paiements
  getPayments: async (tutorId) => {
    return await apiRequest(`/tutor_payments.php?tutor_id=${tutorId}`);
  },

  // Notifications
  getNotifications: async (tutorId, limit = 50) => {
    return await apiRequest(`/tutor_notifications.php?tutor_id=${tutorId}&limit=${limit}`);
  },

  markNotificationAsRead: async (notificationId) => {
    return await apiRequest('/tutor_notifications.php', {
      method: 'PUT',
      body: JSON.stringify({ notification_id: notificationId }),
    });
  },

  deleteNotification: async (notificationId) => {
    return await apiRequest(`/tutor_notifications.php?notification_id=${notificationId}`, {
      method: 'DELETE',
    });
  },

  // Profil
  updateProfile: async (tutorId, profileData) => {
    return await apiRequest('/tutor_profile.php', {
      method: 'PUT',
      body: JSON.stringify({ tutor_id: tutorId, ...profileData }),
    });
  },

  // Structure entities pour compatibilité avec les composants existants
  entities: {
    Student: {
      filter: async (filters) => {
        if (filters.tutorId) {
          return await tutorApi.getStudents(filters.tutorId);
        }
        return [];
      },
      
      create: async (studentData) => {
        return await tutorApi.createStudent(studentData);
      },
      
      update: async (studentId, studentData) => {
        // À implémenter selon votre backend
        return { success: true };
      },
      
      delete: async (studentId) => {
        return { success: true };
      }
    },
    
    Notification: {
      filter: async (filters) => {
        if (filters.recipientId && filters.recipientType) {
          const result = await tutorApi.getNotifications(filters.recipientId);
          return result.notifications || result;
        }
        return [];
      },
      
      create: async (notificationData) => {
        // Créer une notification via l'API admin
        return { success: true };
      },
      
      update: async (notifId, notifData) => {
        if (notifData.read === true) {
          return await tutorApi.markNotificationAsRead(notifId);
        }
        return { success: true };
      }
    },
    
    Bus: {
      list: async () => {
        // Récupérer via le dashboard ou une API dédiée
        return [];
      }
    },
    
    Payment: {
      list: async () => {
        // À implémenter
        return [];
      },
      
      create: async (paymentData) => {
        // À implémenter
        return { success: true };
      }
    }
  }
};

/**
 * API Admin
 */
export const adminApi = {
  login: async (identifier, password) => {
    return await apiRequest('/admin_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  getDashboard: async () => {
    return await apiRequest('/admin_dashboard.php');
  },

  getStats: async () => {
    return await apiRequest('/admin_stats.php');
  },

  /**
 * Récupérer tous les bus
 */
getBuses: async () => {
  return await apiRequest('/admin_buses.php', { method: 'GET' });
},

/**
 * Créer un nouveau bus
 * @param {Object} bus - Les données du bus à créer
 */
createBus: async (bus) => {
  return await apiRequest('/admin_buses.php', {
    method: 'POST',
    body: JSON.stringify(bus),
  });
},

/**
 * Mettre à jour un bus
 * @param {Object} bus - Les données du bus à mettre à jour (inclut l'id)
 */
updateBus: async (bus) => {
  return await apiRequest('/admin_buses.php', {
    method: 'PUT',
    body: JSON.stringify(bus),
  });
},

/**
 * Supprimer un bus
 * @param {number} id - L'identifiant du bus à supprimer
 */
deleteBus: async (id) => {
  return await apiRequest('/admin_buses.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
},

  entities: {
    // À implémenter selon vos besoins
  }
};

/**
 * API Driver
 */
export const driverApi = {
  login: async (identifier, password) => {
    return await apiRequest('/driver_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  entities: {
    // À implémenter selon vos besoins
  }
};

/**
 * API Supervisor
 */
export const supervisorApi = {
  login: async (identifier, password) => {
    return await apiRequest('/supervisor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  entities: {
    // À implémenter selon vos besoins
  }
};

/**
 * Inscrire un nouvel utilisateur
 * @param {Object} user - Les données de l'utilisateur (username, password, role)
 */
export async function registerUser(user) {
  return await apiRequest('/register.php', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

/**
 * Connecter un utilisateur
 * @param {Object} credentials - Les identifiants de l'utilisateur (identifier, password)
 */
export async function loginUser(credentials) {
  return await apiRequest('/tutor_login.php', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export default {
  tutorApi,
  adminApi,
  driverApi,
  supervisorApi,
};
>>>>>>> Stashed changes
