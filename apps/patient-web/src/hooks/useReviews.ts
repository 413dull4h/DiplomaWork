import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  reviewsApi,
  type CreateDoctorReviewPayload,
  type CreateHospitalReviewPayload,
} from '../api/reviews'

export function useMyReviews() {
  return useQuery({
    queryKey: ['patient-reviews'],
    queryFn: reviewsApi.getMyReviews,
  })
}

export function useAppointmentReviewStatus(appointmentId?: string) {
  return useQuery({
    queryKey: ['appointment-review-status', appointmentId],
    queryFn: () => reviewsApi.getAppointmentReviewStatus(appointmentId as string),
    enabled: Boolean(appointmentId),
  })
}

export function useCreateHospitalReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateHospitalReviewPayload) =>
      reviewsApi.createHospitalReview(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointment-review-status', variables.appointmentId],
      })
      queryClient.invalidateQueries({
        queryKey: ['patient-reviews'],
      })
    },
  })
}

export function useCreateDoctorReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDoctorReviewPayload) =>
      reviewsApi.createDoctorReview(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointment-review-status', variables.appointmentId],
      })
      queryClient.invalidateQueries({
        queryKey: ['patient-reviews'],
      })
    },
  })
}