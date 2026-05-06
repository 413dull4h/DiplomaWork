import { Navigate, Route, Routes } from 'react-router-dom'
import { Providers } from './providers'
import { useHospitalSession } from '../hooks/useHospitalSession'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { HospitalShell } from '../components/layout/Layout'
import { LoginPage } from '../pages/public/LoginPage'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { LoadingSkeleton } from '../components/common/Basic'
import { AccountPage, AppointmentDetailsPage, AppointmentsPage, CreateDepartmentPage, CreateDoctorPage, CreateEncounterPage, DashboardPage, DepartmentsPage, DoctorAvailabilityPage, DoctorDetailsPage, DoctorsPage, EditEncounterPage, EncounterDetailsPage, PatientRecordsPage, ProfilePage, SettingsPage, TeleconsultPage } from '../pages/hospital/HospitalPages'

function AppRoutes() {
  const { isRestoring } = useHospitalSession()
  if (isRestoring) return <div className="liquid-bg min-h-screen p-8"><LoadingSkeleton /></div>
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<ProtectedRoute><HospitalShell /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="departments/new" element={<CreateDepartmentPage />} />
      <Route path="doctors" element={<DoctorsPage />} />
      <Route path="doctors/new" element={<CreateDoctorPage />} />
      <Route path="doctors/:hospitalDoctorId" element={<DoctorDetailsPage />} />
      <Route path="doctors/:hospitalDoctorId/availability" element={<DoctorAvailabilityPage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
      <Route path="appointments/:id" element={<AppointmentDetailsPage />} />
      <Route path="appointments/:id/encounter" element={<CreateEncounterPage />} />
      <Route path="encounters/:id" element={<EncounterDetailsPage />} />
      <Route path="encounters/:id/edit" element={<EditEncounterPage />} />
      <Route path="patients/:patientId/records" element={<PatientRecordsPage />} />
      <Route path="teleconsult/:appointmentId" element={<TeleconsultPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="account" element={<AccountPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
export function App() { return <Providers><AppRoutes /></Providers> }
