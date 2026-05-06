import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDoctorEncounter,
  getDoctorAppointment,
  getDoctorAppointments,
  getDoctorDashboard,
  getDoctorPatientRecords,
} from '../../api/doctorAppointments'
import type { AppointmentStatus, CreateEncounterPayload } from '../../types/models'

export function useDoctorDashboard() {
  return useQuery({
    queryKey: ['doctor-dashboard'],
    queryFn: getDoctorDashboard,
  })
}

export function useDoctorAppointments(status?: AppointmentStatus | '') {
  return useQuery({
    queryKey: ['doctor-appointments', status ?? 'all'],
    queryFn: () => getDoctorAppointments(status),
  })
}

export function useDoctorAppointment(appointmentId: string) {
  return useQuery({
    queryKey: ['doctor-appointment', appointmentId],
    queryFn: () => getDoctorAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  })
}

export function useCreateDoctorEncounter(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEncounterPayload) => createDoctorEncounter(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment', appointmentId] })
    },
  })
}

export function useDoctorPatientRecords(patientId: string) {
  return useQuery({
    queryKey: ['doctor-patient-records', patientId],
    queryFn: () => getDoctorPatientRecords(patientId),
    enabled: Boolean(patientId),
  })
}
