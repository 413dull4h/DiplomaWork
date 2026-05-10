import { create } from 'zustand'
import type { AdminUser } from '@/types/models'

const TOKEN_KEY = 'careos.admin.token'
const USER_KEY = 'careos.admin.user'

function safeParseUser(value: string | null): AdminUser | null {
  if (!value) return null
  try {
    return JSON.parse(value) as AdminUser
  } catch {
    return null
  }
}

interface AuthStore {
  token: string | null
  user: AdminUser | null
  isAuthenticated: boolean
avatarUrl?: string | null
  setSession: (token: string, user: AdminUser) => void
  setUser: (user: AdminUser) => void
  clearSession: () => void
  restoreSession: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: safeParseUser(localStorage.getItem(USER_KEY)),
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },
  restoreSession: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = safeParseUser(localStorage.getItem(USER_KEY))
    set({ token, user, isAuthenticated: Boolean(token) })
  },
}))

export function getAuthToken() {
  return useAuthStore.getState().token
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession()
}
