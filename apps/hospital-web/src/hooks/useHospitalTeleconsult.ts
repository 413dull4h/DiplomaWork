import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  endHospitalTeleconsult,
  getHospitalTeleconsult,
  saveHospitalTeleconsultLink,
  startHospitalTeleconsult,
  type SaveHospitalTeleconsultLinkPayload,
} from '../api/teleconsult'

export function useHospitalTeleconsult(
  appointmentId?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['hospital-teleconsult', appointmentId],
    queryFn: () => getHospitalTeleconsult(appointmentId as string),
    enabled: Boolean(appointmentId) && enabled,
  })
}

export function useSaveHospitalTeleconsultLink(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveHospitalTeleconsultLinkPayload) =>
      saveHospitalTeleconsultLink(appointmentId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['hospital-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointments'],
      })
    },
  })
}

export function useStartHospitalTeleconsult(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startHospitalTeleconsult(appointmentId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['hospital-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointments'],
      })
    },
  })
}

export function useEndHospitalTeleconsult(appointmentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => endHospitalTeleconsult(appointmentId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['hospital-teleconsult', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointment', appointmentId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['hospital-appointments'],
      })
    },
  })
}