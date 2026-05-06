import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminMe, loginAdmin } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useMutation } from '@tanstack/react-query'

const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'SUPER_ADMIN'])

export function isAdminRole(role?: string) {
  return Boolean(role && ADMIN_ROLES.has(role))
}

export function useAdminMe(enabled = true) {
  return useQuery({
    queryKey: ['admin-me'],
    queryFn: getAdminMe,
    enabled,
    retry: false,
  })
}

export function useAdminSession() {
  const token = useAuthStore((state) => state.token)
  const storedUser = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  const query = useAdminMe(Boolean(token))

  useEffect(() => {
    if (query.data?.user && token) {
      setSession(token, query.data.user)
    }
  }, [query.data, setSession, token])

  useEffect(() => {
    if (query.isError) clearSession()
  }, [query.isError, clearSession])

  return {
    ...query,
    token,
    user: query.data?.user ?? storedUser,
    isAuthenticated: Boolean(token),
  }
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: loginAdmin,
    onSuccess: (data) => {
      setSession(data.token, data.user)
    },
  })
}
