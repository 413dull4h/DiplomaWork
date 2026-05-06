import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/models'
import { clearAuthSession, getAuthToken } from '@/store/authStore'

const baseURL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4001'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: unknown }>) => {
    if (error.response?.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(parseApiError(error))
  },
)

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      'Request failed.'
    return { message, status: error.response?.status, details: error.response?.data }
  }

  if (typeof error === 'object' && error && 'message' in error) {
    return error as ApiError
  }

  return { message: 'Something went wrong.' }
}
