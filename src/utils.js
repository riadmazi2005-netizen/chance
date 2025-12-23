export const createPageUrl = (pageName) => {
  const routes = {
    'Home': '/',
    'TutorLogin': '/tutor/login',
    'TutorRegister': '/tutor/register',
    'TutorDashboard': '/tutor/dashboard',
    'TutorStudents': '/tutor/students',
    'TutorNotifications': '/tutor/notifications',
    'TutorProfile': '/tutor/profile',
    'AdminLogin': '/admin/login',
    'AdminDashboard': '/admin/dashboard',
    'AdminRegistrations': '/admin/registrations',
    'AdminStudents': '/admin/students',
    'AdminBuses': '/admin/buses',
    'AdminRoutes': '/admin/routes',
    'AdminDrivers': '/admin/drivers',
    'AdminSupervisors': '/admin/supervisors',
    'AdminPayments': '/admin/payments',
    'AdminAccidents': '/admin/accidents',
    'AdminNotifications': '/admin/notifications',
    'AdminStats': '/admin/stats',
    'DriverLogin': '/driver/login',
    'DriverDashboard': '/driver/dashboard',
    'DriverStudents': '/driver/students',
    'DriverNotifications': '/driver/notifications',
    'SupervisorLogin': '/supervisor/login',
    'SupervisorDashboard': '/supervisor/dashboard',
    'SupervisorStudents': '/supervisor/students',
    'SupervisorNotifications': '/supervisor/notifications',
  };
  
  return routes[pageName] || '/';
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};