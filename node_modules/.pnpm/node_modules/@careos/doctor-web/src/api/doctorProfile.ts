import { apiClient } from './client'
import type {
  AvailabilityResponse,
  DoctorProfileResponse,
  UpdateDoctorProfilePayload,
  UpdateDoctorProfileResponse,
} from '../types/models'

export async function getDoctorProfile() {
  const response = await apiClient.get<DoctorProfileResponse>('/hospital/doctor/profile')
  return response.data
}

export async function updateDoctorProfile(payload: UpdateDoctorProfilePayload) {
  const response = await apiClient.patch<UpdateDoctorProfileResponse>('/hospital/doctor/profile', payload)
  return response.data
}

export async function getDoctorAvailability() {
  // TODO: Backend must expose GET /hospital/doctor/availability.
  // The current profile endpoint may already include availabilities, but this function intentionally calls the documented route.
  const response = await apiClient.get<AvailabilityResponse>('/hospital/doctor/availability')
  return response.data
}
