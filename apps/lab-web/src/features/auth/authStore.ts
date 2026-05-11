import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, LabProfile, LabStaff } from '../../types/models'

type AuthState = {
  token: string | null
  user: AuthUser | null
  lab: LabProfile | null
  staff: Pick<LabStaff, 'id' | 'staffRole'> | null
  setSession: (session: {
    token: string
    user: AuthUser
    lab: LabProfile
    staff: Pick<LabStaff, 'id' | 'staffRole'>
  }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      lab: null,
      staff: null,
      setSession: (session) => set(session),
      clearSession: () => set({ token: null, user: null, lab: null, staff: null }),
    }),
    {
      name: 'careos-lab-session',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        lab: state.lab,
        staff: state.staff,
      }),
    }
  )
)
