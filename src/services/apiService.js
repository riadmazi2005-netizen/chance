/**
 * Service API pour communiquer avec le backend PHP
 */

const API_BASE_URL = 'http://localhost/mohammed5-school-bus/backend/api';

/**
 * Fonction utilitaire pour faire des requêtes HTTP
 */
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Pour inclure les cookies de session
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Une erreur est survenue');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * API Tuteur
 */
export const tutorApi = {
  // Authentification
  login: async (identifier, password) => {
    return await apiRequest('/auth/tutor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  register: async (userData) => {
    return await apiRequest('/auth/tutor_register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Dashboard
  getDashboard: async () => {
    return await apiRequest('/tutor/dashboard.php');
  },

  // Élèves
  getStudents: async () => {
    return await apiRequest('/tutor/students.php');
  },

  createStudent: async (studentData) => {
    return await apiRequest('/tutor/students.php', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  // Paiements
  getPayments: async () => {
    return await apiRequest('/tutor/payments.php');
  },

  createPayment: async (paymentData) => {
    return await apiRequest('/tutor/payments.php', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Notifications
  getNotifications: async () => {
    return await apiRequest('/tutor/notifications.php');
  },

  markNotificationAsRead: async (notificationId) => {
    return await apiRequest('/tutor/notifications.php', {
      method: 'PUT',
      body: JSON.stringify({ id: notificationId }),
    });
  },

  deleteNotification: async (notificationId) => {
    return await apiRequest('/tutor/notifications.php', {
      method: 'DELETE',
      body: JSON.stringify({ id: notificationId }),
    });
  },

  // Profil
  getProfile: async () => {
    return await apiRequest('/tutor/profile.php');
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/tutor/profile.php', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

/**
 * API Admin (à compléter)
 */
export const adminApi = {
  login: async (identifier, password) => {
    return await apiRequest('/auth/admin_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
  // ... autres endpoints admin
};

/**
 * API Driver (à compléter)
 */
export const driverApi = {
  login: async (identifier, password) => {
    return await apiRequest('/auth/driver_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
  // ... autres endpoints driver
};

/**
 * API Supervisor (à compléter)
 */
export const supervisorApi = {
  login: async (identifier, password) => {
    return await apiRequest('/auth/supervisor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
  // ... autres endpoints supervisor
};

export default {
  tutorApi,
  adminApi,
  driverApi,
  supervisorApi,
};