import { apiClient } from './client'

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ReviewTargetStatus = {
  appointmentId: string
  canReview: boolean
  status: string
  hospitalReviewSubmitted: boolean
  doctorReviewSubmitted: boolean
  hospital?: {
    id: string
    name: string
  }
  doctor?: {
    id: string
    fullName: string
    specialization?: string | null
  }
  department?: {
    id: string
    name: string
  } | null
}

export type CreateHospitalReviewPayload = {
  appointmentId: string
  overallRating: number
  staffRating?: number
  cleanlinessRating?: number
  waitingTimeRating?: number
  serviceRating?: number
  comment?: string
}

export type CreateDoctorReviewPayload = {
  appointmentId: string
  overallRating: number
  communicationRating?: number
  professionalismRating?: number
  helpfulnessRating?: number
  wouldRecommend?: boolean
  comment?: string
}

export type PatientReviewsResponse = {
  hospitalReviews: any[]
  doctorReviews: any[]
}

export const reviewsApi = {
  async getMyReviews() {
    const response = await apiClient.get<PatientReviewsResponse>('/patient/reviews')
    return response.data
  },

  async getAppointmentReviewStatus(appointmentId: string) {
    const response = await apiClient.get<ReviewTargetStatus>(
      `/patient/reviews/appointment/${appointmentId}/status`
    )
    return response.data
  },

  async createHospitalReview(payload: CreateHospitalReviewPayload) {
    const response = await apiClient.post('/patient/reviews/hospital', payload)
    return response.data
  },

  async createDoctorReview(payload: CreateDoctorReviewPayload) {
    const response = await apiClient.post('/patient/reviews/doctor', payload)
    return response.data
  },
}