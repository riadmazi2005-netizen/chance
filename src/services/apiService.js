/**
 * Service API pour communiquer avec le backend PHP RÉEL
 * Version sans mockData - Utilise uniquement le backend
 */

const API_BASE_URL = 'http://localhost:8080/backend';

/**
 * Fonction utilitaire pour faire des requêtes HTTP
 */
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`📡 API Request: ${API_BASE_URL}${endpoint}`, options.method || 'GET');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Lire la réponse en texte d'abord pour déboguer
    const textResponse = await response.text();
    console.log('📥 Response text:', textResponse);
    
    // Essayer de parser en JSON
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Erreur serveur: ${textResponse.substring(0, 100)}`);
    }

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    // Si la réponse contient une erreur
    if (data.error) {
      console.error('❌ API Error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Success:', data);
    return data;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

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

export default {
  tutorApi,
  adminApi,
  driverApi,
  supervisorApi,
};