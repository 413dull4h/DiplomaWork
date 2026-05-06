import { useQuery } from '@tanstack/react-query'
import { getAppointment, getAppointments, type AppointmentsQuery } from '@/api/appointments'

export function useAppointments(filters: AppointmentsQuery) {
  return useQuery({
    queryKey: ['admin-appointments', filters],
    queryFn: () => getAppointments(filters),
  })
}

export function useAppointment(id?: string) {
  return useQuery({
    queryKey: ['admin-appointment', id],
    queryFn: () => getAppointment(id!),
    enabled: Boolean(id),
  })
}
