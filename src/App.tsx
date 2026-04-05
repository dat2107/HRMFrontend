import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/login/LoginPage'
import ChangePasswordPage from './pages/change-password/ChangePasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LookupPage from './pages/lookup/LookupPage'
import AdminPage from './pages/admin/AdminPage'

function isAuthenticated() {
  return !!localStorage.getItem('hrm_token')
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lookup" element={<LookupPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
