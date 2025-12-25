// src/services/apiService.js

const API_BASE_URL = 'http://localhost/transport_scolaire/backend/api';

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