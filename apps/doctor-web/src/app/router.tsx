import { Navigate, createBrowserRouter } from 'react-router-dom'
import { DoctorShell } from '../components/layout/DoctorShell'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { DoctorDashboardPage } from '../features/dashboard/DoctorDashboardPage'
import { DoctorAppointmentsPage } from '../features/appointments/DoctorAppointmentsPage'
import { DoctorAppointmentDetailsPage } from '../features/appointments/DoctorAppointmentDetailsPage'
import { CreateDoctorEncounterPage } from '../features/appointments/CreateDoctorEncounterPage'
import { DoctorProfilePage } from '../features/profile/DoctorProfilePage'
import { EditDoctorProfilePage } from '../features/profile/EditDoctorProfilePage'
import { DoctorPatientRecordsPage } from '../features/records/DoctorPatientRecordsPage'
import { DoctorSchedulePage } from '../features/schedule/DoctorSchedulePage'
import { DoctorSettingsPage } from '../features/settings/DoctorSettingsPage'
import { ChatsPage, ChatDetailPage } from '../pages/ChatsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DoctorShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: 'dashboard', element: <DoctorDashboardPage /> },

      { path: 'appointments', element: <DoctorAppointmentsPage /> },
      {
        path: 'appointments/:appointmentId',
        element: <DoctorAppointmentDetailsPage />,
      },
      {
        path: 'appointments/:appointmentId/encounter',
        element: <CreateDoctorEncounterPage />,
      },

      { path: 'chats', element: <ChatsPage /> },
      { path: 'chats/:threadId', element: <ChatDetailPage /> },

      {
        path: 'patients/:patientId/records',
        element: <DoctorPatientRecordsPage />,
      },

      { path: 'profile', element: <DoctorProfilePage /> },
      { path: 'profile/edit', element: <EditDoctorProfilePage /> },
      { path: 'schedule', element: <DoctorSchedulePage /> },
      { path: 'settings', element: <DoctorSettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])