import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  endDoctorTeleconsult,
  getDoctorTeleconsult,
  saveDoctorTeleconsultLink,
  startDoctorTeleconsult,
  type SaveTeleconsultLinkPayload,
} from '../api/teleconsult'

export function useDoctorTeleconsult(appointmentId?: string) {
  return useQuery({
    queryKey: ['doctor-teleconsult', appointmentId],
    queryFn: () => getDoctorTeleconsult(appointmentId as string),
    enabled: Boolean(appointmentId),
  })
}

export function useSaveDoctorTeleconsultLink(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveTeleconsultLinkPayload) =>
      saveDoctorTeleconsultLink(appointmentId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['doctor-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointments'],
      })
    },
  })
}

export function useStartDoctorTeleconsult(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startDoctorTeleconsult(appointmentId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['doctor-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointments'],
      })
    },
  })
}

export function useEndDoctorTeleconsult(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => endDoctorTeleconsult(appointmentId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['doctor-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointments'],
      })
    },
  })
}