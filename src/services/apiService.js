/**
 * Service API pour communiquer avec le backend PHP
 * Version corrigée avec la bonne structure de dossiers
 */

const API_BASE_URL = 'http://localhost/mohammed5-school-bus/backend';

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    // Si la réponse contient une erreur
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
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
    return await apiRequest('/tutor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  register: async (userData) => {
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
  getProfile: async (tutorId) => {
    return await apiRequest(`/tutor_profile.php?tutor_id=${tutorId}`);
  },

  updateProfile: async (tutorId, profileData) => {
    return await apiRequest('/tutor_profile.php', {
      method: 'PUT',
      body: JSON.stringify({ tutor_id: tutorId, ...profileData }),
    });
  },
};

/**
 * API Admin
 */
export const adminApi = {
  // Authentification
  login: async (identifier, password) => {
    return await apiRequest('/admin_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // Dashboard
  getDashboard: async () => {
    return await apiRequest('/admin_dashboard.php');
  },

  // Statistiques
  getStats: async () => {
    return await apiRequest('/admin_stats.php');
  },

  // Demandes d'inscription
  getRegistrations: async () => {
    return await apiRequest('/admin_registrations.php');
  },

  approveRegistration: async (studentId) => {
    return await apiRequest('/admin_registrations.php', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, action: 'approve' }),
    });
  },

  rejectRegistration: async (studentId) => {
    return await apiRequest('/admin_registrations.php', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, action: 'reject' }),
    });
  },

  // Élèves
  getStudents: async () => {
    return await apiRequest('/admin_students.php');
  },

  // Paiements
  getPayments: async () => {
    return await apiRequest('/admin_payments.php');
  },

  validatePayment: async (paymentId, busId, busGroup) => {
    return await apiRequest('/admin_payments.php', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, bus_id: busId, bus_group: busGroup }),
    });
  },

  // Bus
  getBuses: async () => {
    return await apiRequest('/admin_buses.php');
  },

  createBus: async (busData) => {
    return await apiRequest('/admin_buses.php', {
      method: 'POST',
      body: JSON.stringify(busData),
    });
  },

  updateBus: async (busData) => {
    return await apiRequest('/admin_buses.php', {
      method: 'PUT',
      body: JSON.stringify(busData),
    });
  },

  deleteBus: async (busId) => {
    return await apiRequest(`/admin_buses.php?id=${busId}`, {
      method: 'DELETE',
    });
  },

  // Chauffeurs
  getDrivers: async () => {
    return await apiRequest('/admin_drivers.php');
  },

  createDriver: async (driverData) => {
    return await apiRequest('/admin_drivers.php', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  },

  updateDriver: async (driverData) => {
    return await apiRequest('/admin_drivers.php', {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
  },

  deleteDriver: async (driverId) => {
    return await apiRequest(`/admin_drivers.php?id=${driverId}`, {
      method: 'DELETE',
    });
  },

  // Superviseurs
  getSupervisors: async () => {
    return await apiRequest('/admin_supervisors.php');
  },

  createSupervisor: async (supervisorData) => {
    return await apiRequest('/admin_supervisors.php', {
      method: 'POST',
      body: JSON.stringify(supervisorData),
    });
  },

  updateSupervisor: async (supervisorData) => {
    return await apiRequest('/admin_supervisors.php', {
      method: 'PUT',
      body: JSON.stringify(supervisorData),
    });
  },

  deleteSupervisor: async (supervisorId) => {
    return await apiRequest(`/admin_supervisors.php?id=${supervisorId}`, {
      method: 'DELETE',
    });
  },

  // Trajets
  getRoutes: async () => {
    return await apiRequest('/admin_routes.php');
  },

  createRoute: async (routeData) => {
    return await apiRequest('/admin_routes.php', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },

  updateRoute: async (routeData) => {
    return await apiRequest('/admin_routes.php', {
      method: 'PUT',
      body: JSON.stringify(routeData),
    });
  },

  deleteRoute: async (routeId) => {
    return await apiRequest(`/admin_routes.php?id=${routeId}`, {
      method: 'DELETE',
    });
  },

  // Absences
  getAbsences: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await apiRequest(`/admin_absences.php?${params}`);
  },
};

/**
 * API Chauffeur
 */
export const driverApi = {
  // Authentification
  login: async (identifier, password) => {
    return await apiRequest('/driver_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // Dashboard
  getDashboard: async (driverId) => {
    return await apiRequest(`/driver_dashboard.php?driver_id=${driverId}`);
  },

  // Élèves
  getStudents: async (driverId) => {
    return await apiRequest(`/driver_students.php?driver_id=${driverId}`);
  },

  // Notifications
  getNotifications: async (driverId, limit = 50) => {
    return await apiRequest(`/driver_notifications.php?driver_id=${driverId}&limit=${limit}`);
  },

  markNotificationAsRead: async (notificationId) => {
    return await apiRequest('/driver_notifications.php', {
      method: 'PUT',
      body: JSON.stringify({ notification_id: notificationId }),
    });
  },

  deleteNotification: async (notificationId) => {
    return await apiRequest(`/driver_notifications.php?notification_id=${notificationId}`, {
      method: 'DELETE',
    });
  },

  // Profil
  getProfile: async (driverId) => {
    return await apiRequest(`/driver_profile.php?driver_id=${driverId}`);
  },

  updateProfile: async (driverId, profileData) => {
    return await apiRequest('/driver_profile.php', {
      method: 'PUT',
      body: JSON.stringify({ driver_id: driverId, ...profileData }),
    });
  },

  // Dépenses
  getExpenses: async (driverId) => {
    return await apiRequest(`/driver_expenses.php?driver_id=${driverId}`);
  },

  createExpense: async (expenseData) => {
    return await apiRequest('/driver_expenses.php', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  // Demandes d'augmentation
  getRaiseRequests: async (driverId) => {
    return await apiRequest(`/driver_raise_request.php?driver_id=${driverId}`);
  },

  createRaiseRequest: async (driverId, reasons) => {
    return await apiRequest('/driver_raise_request.php', {
      method: 'POST',
      body: JSON.stringify({ driver_id: driverId, reasons }),
    });
  },
};

/**
 * API Superviseur
 */
export const supervisorApi = {
  // Authentification
  login: async (identifier, password) => {
    return await apiRequest('/supervisor_login.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // Dashboard
  getDashboard: async (supervisorId) => {
    return await apiRequest(`/supervisor_dashboard.php?supervisor_id=${supervisorId}`);
  },

  // Élèves
  getStudents: async (supervisorId) => {
    return await apiRequest(`/supervisor_students.php?supervisor_id=${supervisorId}`);
  },

  updateStudent: async (supervisorId, studentData) => {
    return await apiRequest('/supervisor_students.php', {
      method: 'PUT',
      body: JSON.stringify({ supervisor_id: supervisorId, ...studentData }),
    });
  },

  // Présences
  getAttendance: async (supervisorId, date, period) => {
    return await apiRequest(
      `/supervisor_attendance.php?supervisor_id=${supervisorId}&date=${date}&period=${period}`
    );
  },

  markAttendance: async (attendanceData) => {
    return await apiRequest('/supervisor_attendance.php', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  // Notifications
  getNotifications: async (supervisorId, limit = 50) => {
    return await apiRequest(`/supervisor_notifications.php?supervisor_id=${supervisorId}&limit=${limit}`);
  },

  sendNotification: async (notificationData) => {
    return await apiRequest('/supervisor_notifications.php', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  markNotificationAsRead: async (notificationId) => {
    return await apiRequest('/supervisor_notifications.php', {
      method: 'PUT',
      body: JSON.stringify({ notification_id: notificationId }),
    });
  },

  // Demandes d'augmentation
  getRaiseRequests: async (supervisorId) => {
    return await apiRequest(`/supervisor_raise_request.php?supervisor_id=${supervisorId}`);
  },

  createRaiseRequest: async (supervisorId, reasons) => {
    return await apiRequest('/supervisor_raise_request.php', {
      method: 'POST',
      body: JSON.stringify({ supervisor_id: supervisorId, reasons }),
    });
  },
};

export default {
  tutorApi,
  adminApi,
  driverApi,
  supervisorApi,
};