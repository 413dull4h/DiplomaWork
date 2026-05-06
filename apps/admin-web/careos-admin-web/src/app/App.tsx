import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '@/layouts/AdminShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/pages/public/LoginPage'
import { UnauthorizedPage } from '@/pages/public/UnauthorizedPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { HospitalsPage } from '@/pages/admin/HospitalsPage'
import { CreateHospitalPage } from '@/pages/admin/CreateHospitalPage'
import { HospitalDetailsPage } from '@/pages/admin/HospitalDetailsPage'
import { CreateHospitalAdminPage } from '@/pages/admin/CreateHospitalAdminPage'
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage'
import { AppointmentsPage } from '@/pages/admin/AppointmentsPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AccountPage } from '@/pages/admin/AccountPage'

export function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/hospitals" element={<HospitalsPage />} />
      <Route path="/hospitals/new" element={<CreateHospitalPage />} />
      <Route path="/hospitals/:id" element={<HospitalDetailsPage />} />
      <Route path="/hospitals/:id/create-admin" element={<CreateHospitalAdminPage />} />
      <Route path="/audit-logs" element={<AuditLogsPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
