import axios, { AxiosError } from 'axios'
import { clearDoctorSession, getDoctorToken } from '../features/auth/authStore'
import type { ApiErrorShape } from '../types/models'

const baseURL = import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

export class ApiError extends Error {
  status?: number
  errors?: unknown

  constructor(payload: ApiErrorShape) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = payload.status
    this.errors = payload.errors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractMessage(data: unknown): string {
  if (isRecord(data) && typeof data.message === 'string') {
    return data.message
  }
  return 'Something went wrong. Please try again.'
}

function extractErrors(data: unknown): unknown {
  if (isRecord(data) && 'errors' in data) {
    return data.errors
  }
  return undefined
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getDoctorToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      clearDoctorSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(
      new ApiError({
        status,
        message: extractMessage(data),
        errors: extractErrors(data),
      }),
    )
  },
)
