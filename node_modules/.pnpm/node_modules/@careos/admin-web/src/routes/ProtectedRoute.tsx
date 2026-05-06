import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { useAdminSession, isAdminRole } from '@/hooks/useAdminSession'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, user, isLoading } = useAdminSession()
  if (!token) return <Navigate to="/login" replace />
  if (isLoading && !user) return <div className="p-6"><LoadingSkeleton rows={5} /></div>
  if (!isAdminRole(user?.primaryRole)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
