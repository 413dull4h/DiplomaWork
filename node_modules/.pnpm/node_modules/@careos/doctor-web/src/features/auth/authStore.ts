import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Department, Doctor, DoctorUser, Hospital } from '../../types/models'

type DoctorSession = {
  token: string
  user: DoctorUser
  doctor: Doctor
  hospital: Hospital
  department?: Department | null
  hospitalDoctorId: string
}

type AuthState = {
  session: DoctorSession | null
  setSession: (session: DoctorSession) => void
  clearSession: () => void
  updateUser: (user: DoctorUser | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      updateUser: (user) =>
        set((state) => {
          if (!state.session || !user) return state
          return { session: { ...state.session, user } }
        }),
    }),
    {
      name: 'careos-doctor-session',
      partialize: (state) => ({ session: state.session }),
    },
  ),
)

export function getDoctorToken() {
  return useAuthStore.getState().session?.token ?? null
}

export function clearDoctorSession() {
  useAuthStore.getState().clearSession()
}
