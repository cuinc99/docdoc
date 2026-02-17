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
import SchedulesPage from '@/pages/SchedulesPage'
import QueuePage from '@/pages/QueuePage'
import VitalsPage from '@/pages/VitalsPage'
import ConsultationPage from '@/pages/ConsultationPage'
import MedicalRecordsPage from '@/pages/MedicalRecordsPage'
import MedicalRecordDetailPage from '@/pages/MedicalRecordDetailPage'
import EditMedicalRecordPage from '@/pages/EditMedicalRecordPage'
import PrescriptionsPage from '@/pages/PrescriptionsPage'
import BillingPage from '@/pages/BillingPage'
import CreateInvoicePage from '@/pages/CreateInvoicePage'
import InvoiceDetailPage from '@/pages/InvoiceDetailPage'
import EditInvoicePage from '@/pages/EditInvoicePage'

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
              <Route path="/schedules" element={<SchedulesPage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/queue/:id/vitals" element={<VitalsPage />} />
              <Route path="/queue/:id/consultation" element={<ConsultationPage />} />
              <Route path="/medical-records" element={<MedicalRecordsPage />} />
              <Route path="/medical-records/:id" element={<MedicalRecordDetailPage />} />
              <Route path="/medical-records/:id/edit" element={<EditMedicalRecordPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/create" element={<CreateInvoicePage />} />
              <Route path="/billing/:id" element={<InvoiceDetailPage />} />
              <Route path="/billing/:id/edit" element={<EditInvoicePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
