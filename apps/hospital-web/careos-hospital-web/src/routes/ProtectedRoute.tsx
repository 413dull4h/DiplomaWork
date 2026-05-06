import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LoadingSkeleton } from '../components/common/Basic'
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore(s => s.token), user = useAuthStore(s => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (!user) return <div className="liquid-bg min-h-screen p-8"><LoadingSkeleton /></div>
  if (user.primaryRole !== 'HOSPITAL_ADMIN' && user.primaryRole !== 'HOSPITAL_STAFF') return <Navigate to="/unauthorized" replace />
  return children
}
