import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import PatientsPage from '@/pages/PatientsPage'
import PatientDetailPage from '@/pages/PatientDetailPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
