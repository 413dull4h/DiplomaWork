import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDoctorLabOrder,
  getDoctorAppointmentLabOrders,
  getDoctorLabs,
  getDoctorLabTests,
  getDoctorLabReport,
  type CreateDoctorLabOrderPayload,
} from '../api/labOrders'

export function useDoctorLabs() {
  return useQuery({
    queryKey: ['doctor-labs'],
    queryFn: getDoctorLabs,
  })
}

export function useDoctorLabTests(labId: string, enabled = true) {
  return useQuery({
    queryKey: ['doctor-lab-tests', labId],
    queryFn: () => getDoctorLabTests(labId),
    enabled: Boolean(labId) && enabled,
  })
}

export function useDoctorAppointmentLabOrders(appointmentId: string) {
  return useQuery({
    queryKey: ['doctor-appointment-lab-orders', appointmentId],
    queryFn: () => getDoctorAppointmentLabOrders(appointmentId),
    enabled: Boolean(appointmentId),
  })
}

export function useCreateDoctorLabOrder(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDoctorLabOrderPayload) =>
      createDoctorLabOrder(appointmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['doctor-appointment-lab-orders', appointmentId],
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

export function useDoctorLabReport(reportId: string) {
  return useQuery({
    queryKey: ['doctor-lab-report', reportId],
    queryFn: () => getDoctorLabReport(reportId),
    enabled: Boolean(reportId),
  })
}