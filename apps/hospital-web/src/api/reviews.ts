import { apiClient } from './client'

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type HospitalReviewSummary = {
  hospitalReviews: {
    pending: number
    approved: number
    rejected: number
    average?: Record<string, number | null>
  }
  doctorReviews: {
    pending: number
    approved: number
    rejected: number
    average?: Record<string, number | null>
  }
  patientVisitFeedback: {
    total: number
  }
}

export type ReviewQuery = {
  status?: ReviewStatus | ''
  doctorId?: string
  limit?: number
}

export const hospitalReviewsApi = {
  async getSummary() {
    const response = await apiClient.get<HospitalReviewSummary>(
      '/hospital/reviews/summary'
    )
    return response.data
  },

  async getHospitalReviews(query: ReviewQuery = {}) {
    const response = await apiClient.get('/hospital/reviews/hospital', {
      params: {
        status: query.status || undefined,
        limit: query.limit || 50,
      },
    })
    return response.data.reviews as any[]
  },

  async getDoctorReviews(query: ReviewQuery = {}) {
    const response = await apiClient.get('/hospital/reviews/doctors', {
      params: {
        status: query.status || undefined,
        doctorId: query.doctorId || undefined,
        limit: query.limit || 50,
      },
    })
    return response.data.reviews as any[]
  },

  async getPatientFeedbackByPatient(patientId: string) {
    const response = await apiClient.get(
      `/hospital/reviews/patients/${patientId}/visit-feedback`
    )
    return response.data.feedbacks as any[]
  },

  async getAppointmentPatientFeedback(appointmentId: string) {
    const response = await apiClient.get(
      `/hospital/reviews/appointments/${appointmentId}/patient-feedback`
    )
    return response.data.feedback
  },
}