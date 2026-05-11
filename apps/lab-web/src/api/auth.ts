import { apiClient, unwrapResponse } from './client'
import type { AuthResponse } from '../types/models'

export type LoginPayload = {
  email: string
  password: string
}

export async function loginLab(payload: LoginPayload) {
  const response = await apiClient.post('/lab/auth/login', payload)
  return unwrapResponse<AuthResponse>(response.data)
}

export async function getLabMe() {
  const response = await apiClient.get('/lab/auth/me')
  return unwrapResponse<{ user: AuthResponse['user']; lab: AuthResponse['lab']; staff: AuthResponse['staff'] }>(response.data)
}
