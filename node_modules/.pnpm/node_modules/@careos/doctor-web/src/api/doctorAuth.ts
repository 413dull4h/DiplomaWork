import { apiClient } from './client'
import type { DoctorLoginResponse, DoctorMeResponse } from '../types/models'

export type DoctorLoginPayload = {
  email: string
  password: string
}

export async function loginDoctor(payload: DoctorLoginPayload) {
  const response = await apiClient.post<DoctorLoginResponse>('/hospital/doctor-auth/login', payload)
  return response.data
}

export async function getDoctorMe() {
  const response = await apiClient.get<DoctorMeResponse>('/hospital/doctor-auth/me')
  return response.data
}
