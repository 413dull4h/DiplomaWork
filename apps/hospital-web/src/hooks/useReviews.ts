import { useQuery } from '@tanstack/react-query'
import {
  hospitalReviewsApi,
  type ReviewStatus,
} from '../api/reviews'

export function useHospitalReviewSummary() {
  return useQuery({
    queryKey: ['hospital-review-summary'],
    queryFn: hospitalReviewsApi.getSummary,
  })
}

export function useHospitalReviews(status?: ReviewStatus | '') {
  return useQuery({
    queryKey: ['hospital-reviews', status],
    queryFn: () =>
      hospitalReviewsApi.getHospitalReviews({
        status,
      }),
  })
}

export function useDoctorReviews(status?: ReviewStatus | '') {
  return useQuery({
    queryKey: ['doctor-reviews', status],
    queryFn: () =>
      hospitalReviewsApi.getDoctorReviews({
        status,
      }),
  })
}

export function usePatientVisitFeedback(patientId?: string) {
  return useQuery({
    queryKey: ['patient-visit-feedback', patientId],
    queryFn: () =>
      hospitalReviewsApi.getPatientFeedbackByPatient(patientId as string),
    enabled: Boolean(patientId),
  })
}