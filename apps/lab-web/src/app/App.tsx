import { Navigate, Outlet } from 'react-router-dom'
import { LabShell } from '../components/layout/LabShell'

export function App() {
  return (
    <LabShell>
      <Outlet />
    </LabShell>
  )
}

export function RootRedirect() {
  return <Navigate to="/dashboard" replace />
}
