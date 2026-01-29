// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import LeaderDashboard from './pages/leader/LeaderDashboard.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ManageClubs from './pages/admin/ManageClubs.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx'
import ManageEvents from './pages/admin/ReviewEvents.jsx'
import LeaderMemberships from './pages/leader/LeaderMemberships.jsx'
import LeaderEvents from './pages/leader/LeaderEvents.jsx'
import LeaderAttendance from './pages/leader/LeaderAttendance.jsx'
import StudentClubs from './pages/student/StudentClubs.jsx'
import StudentEvents from './pages/student/StudentEvents.jsx'
import StudentMyevents from './pages/student/StudentMyEvents.jsx'
import StudentPayment from "./pages/student/StudentPayment";
import { ProtectedRoute } from './components/ProtectedRoute';
import Reports from './pages/admin/Reports.jsx'
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clubs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageClubs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />


        {/* Leader */}
        <Route
          path="/leader/dashboard"
          element={
            <ProtectedRoute allowedRoles={['leader']}>
              <LeaderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/memberships"
          element={
            <ProtectedRoute allowedRoles={['leader']}>
              <LeaderMemberships />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leader/events"
          element={
            <ProtectedRoute allowedRoles={['leader']}>
              <LeaderEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leader/attendance"
          element={
            <ProtectedRoute allowedRoles={['leader']}>
              <LeaderAttendance />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/clubs"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentClubs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/events"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/my-events"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMyevents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/pay/:eventId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentPayment />
            </ProtectedRoute>
          }
        />


        {/* 404 */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-foreground">404 - Page Not Found</div>} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;