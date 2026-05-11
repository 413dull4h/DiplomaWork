import { createBrowserRouter } from 'react-router-dom'
import { App, RootRedirect } from './App'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { LabProfilePage } from '../features/profile/LabProfilePage'
import { TestsPage } from '../features/tests/TestsPage'
import { TestFormPage } from '../features/tests/TestFormPage'
import { TestDetailPage } from '../features/tests/TestDetailPage'
import { OrdersPage } from '../features/orders/OrdersPage'
import { OrderDetailPage } from '../features/orders/OrderDetailPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { ReportDetailPage } from '../features/reports/ReportDetailPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { SettingsPage } from '../features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <LabProfilePage /> },
      { path: 'tests', element: <TestsPage /> },
      { path: 'tests/new', element: <TestFormPage mode="create" /> },
      { path: 'tests/:id', element: <TestDetailPage /> },
      { path: 'tests/:id/edit', element: <TestFormPage mode="edit" /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'reports/:id', element: <ReportDetailPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
