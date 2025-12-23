import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Pages
import Home from './pages/Home'
import TutorLogin from './pages/TutorLogin'
import TutorRegister from './pages/TutorRegister'
import TutorDashboard from './pages/TutorDashboard'
import TutorStudents from './pages/TutorStudents'
import TutorNotifications from './pages/TutorNotifications'
import TutorProfile from './pages/TutorProfile'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminRegistrations from './pages/AdminRegistratios'
import AdminStudents from './pages/AdminStudents'
import AdminBuses from './pages/AdminBuses'
import AdminRoutes from './pages/AdminRoutes'
import AdminDrivers from './pages/AdminDrivers'
import AdminSupervisors from './pages/AdminSupervisors'
import AdminPayments from './pages/AdminPayments'
import AdminAccidents from './pages/AdminAccidents'
import AdminNotifications from './pages/AdminNotifications'
import AdminStats from './pages/AdminStats'
import DriverLogin from './pages/DriverLogin'
import DriverDashboard from './pages/DriverDashboard'
import DriverStudents from './pages/DriverStudents'
import DriverNotifications from './pages/DriverNotifications'
import SupervisorLogin from './pages/SupervisorLogin'
import SupervisorDashboard from './pages/SupervisorDashboard'
import SupervisorStudents from './pages/SupervisorStudents'
import SupervisorNotifications from './pages/SupervisorNotifications'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Tutor Routes */}
        <Route path="/tutor/login" element={<TutorLogin />} />
        <Route path="/tutor/register" element={<TutorRegister />} />
        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
        <Route path="/tutor/students" element={<TutorStudents />} />
        <Route path="/tutor/notifications" element={<TutorNotifications />} />
        <Route path="/tutor/profile" element={<TutorProfile />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/registrations" element={<AdminRegistrations />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/buses" element={<AdminBuses />} />
        <Route path="/admin/routes" element={<AdminRoutes />} />
        <Route path="/admin/drivers" element={<AdminDrivers />} />
        <Route path="/admin/supervisors" element={<AdminSupervisors />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/accidents" element={<AdminAccidents />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/stats" element={<AdminStats />} />
        
        {/* Driver Routes */}
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/students" element={<DriverStudents />} />
        <Route path="/driver/notifications" element={<DriverNotifications />} />
        
        {/* Supervisor Routes */}
        <Route path="/supervisor/login" element={<SupervisorLogin />} />
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        <Route path="/supervisor/students" element={<SupervisorStudents />} />
        <Route path="/supervisor/notifications" element={<SupervisorNotifications />} />
      </Routes>
    </Router>
  )
}

export default App