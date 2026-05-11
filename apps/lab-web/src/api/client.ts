import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../features/auth/authStore'

export const LAB_API_URL = import.meta.env.VITE_LAB_API_URL || 'http://localhost:4004'

export class MissingEndpointError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingEndpointError'
  }
}

export const apiClient = axios.create({
  baseURL: LAB_API_URL,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession()

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function unwrapResponse<T>(payload: unknown, fallbackKey?: string): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if ('data' in record && record.data !== undefined) {
      return record.data as T
    }

    if (fallbackKey && record[fallbackKey] !== undefined) {
      return record[fallbackKey] as T
    }
  }

  return payload as T
}
