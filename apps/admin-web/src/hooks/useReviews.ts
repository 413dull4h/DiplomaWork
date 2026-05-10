import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminReviewsApi,
  type ModerationPayload,
  type ReviewStatus,
} from '../api/reviews'

export function useAdminReviewSummary() {
  return useQuery({
    queryKey: ['admin-review-summary'],
    queryFn: adminReviewsApi.getSummary,
  })
}

export function useAdminHospitalReviews(status?: ReviewStatus | '') {
  return useQuery({
    queryKey: ['admin-hospital-reviews', status],
    queryFn: () =>
      adminReviewsApi.getHospitalReviews({
        status,
      }),
  })
}

export function useAdminDoctorReviews(status?: ReviewStatus | '') {
  return useQuery({
    queryKey: ['admin-doctor-reviews', status],
    queryFn: () =>
      adminReviewsApi.getDoctorReviews({
        status,
      }),
  })
}

export function useAdminPatientFeedback() {
  return useQuery({
    queryKey: ['admin-patient-feedback'],
    queryFn: () => adminReviewsApi.getPatientFeedback(),
  })
}

function useRefreshReviews() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-review-summary'] })
    queryClient.invalidateQueries({ queryKey: ['admin-hospital-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin-doctor-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin-patient-feedback'] })
  }
}

export function useApproveHospitalReview() {
  const refresh = useRefreshReviews()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ModerationPayload
    }) => adminReviewsApi.approveHospitalReview(id, payload),
    onSuccess: refresh,
  })
}

export function useRejectHospitalReview() {
  const refresh = useRefreshReviews()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ModerationPayload
    }) => adminReviewsApi.rejectHospitalReview(id, payload),
    onSuccess: refresh,
  })
}

export function useApproveDoctorReview() {
  const refresh = useRefreshReviews()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ModerationPayload
    }) => adminReviewsApi.approveDoctorReview(id, payload),
    onSuccess: refresh,
  })
}

export function useRejectDoctorReview() {
  const refresh = useRefreshReviews()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ModerationPayload
    }) => adminReviewsApi.rejectDoctorReview(id, payload),
    onSuccess: refresh,
  })
}