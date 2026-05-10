import { apiClient } from './client'

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ReviewQuery = {
  status?: ReviewStatus | ''
  hospitalId?: string
  doctorId?: string
  limit?: number
}

export type ModerationPayload = {
  moderationNote?: string
}

export type AdminReviewSummary = {
  hospitalReviews: {
    pending: number
    approved: number
    rejected: number
  }
  doctorReviews: {
    pending: number
    approved: number
    rejected: number
  }
  patientVisitFeedback: {
    total: number
  }
}

export const adminReviewsApi = {
  async getSummary() {
    const response = await apiClient.get<AdminReviewSummary>(
      '/admin/reviews/summary'
    )
    return response.data
  },

  async getHospitalReviews(query: ReviewQuery = {}) {
    const response = await apiClient.get('/admin/reviews/hospitals', {
      params: {
        status: query.status || undefined,
        hospitalId: query.hospitalId || undefined,
        limit: query.limit || 50,
      },
    })

    return response.data.reviews as any[]
  },

  async getDoctorReviews(query: ReviewQuery = {}) {
    const response = await apiClient.get('/admin/reviews/doctors', {
      params: {
        status: query.status || undefined,
        hospitalId: query.hospitalId || undefined,
        doctorId: query.doctorId || undefined,
        limit: query.limit || 50,
      },
    })

    return response.data.reviews as any[]
  },

  async getPatientFeedback(query: ReviewQuery = {}) {
    const response = await apiClient.get('/admin/reviews/patient-feedback', {
      params: {
        hospitalId: query.hospitalId || undefined,
        doctorId: query.doctorId || undefined,
        limit: query.limit || 50,
      },
    })

    return response.data.feedbacks as any[]
  },

  async approveHospitalReview(id: string, payload: ModerationPayload) {
    const response = await apiClient.patch(
      `/admin/reviews/hospitals/${id}/approve`,
      payload
    )
    return response.data
  },

  async rejectHospitalReview(id: string, payload: ModerationPayload) {
    const response = await apiClient.patch(
      `/admin/reviews/hospitals/${id}/reject`,
      payload
    )
    return response.data
  },

  async approveDoctorReview(id: string, payload: ModerationPayload) {
    const response = await apiClient.patch(
      `/admin/reviews/doctors/${id}/approve`,
      payload
    )
    return response.data
  },

  async rejectDoctorReview(id: string, payload: ModerationPayload) {
    const response = await apiClient.patch(
      `/admin/reviews/doctors/${id}/reject`,
      payload
    )
    return response.data
  },
}