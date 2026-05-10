import { apiClient } from './client'
import type {
  AvailabilityResponse,
  DoctorProfileResponse,
  UpdateDoctorProfilePayload,
  UpdateDoctorProfileResponse,
} from '../types/models'

export type DoctorAvatarResponse = {
  message: string
  profileImageUrl: string
  doctor: DoctorProfileResponse['doctor']
}

export type DeleteDoctorAvatarResponse = {
  message: string
  doctor: DoctorProfileResponse['doctor']
}

export async function getDoctorProfile() {
  const response = await apiClient.get<DoctorProfileResponse>(
    '/hospital/doctor/profile'
  )

  return response.data
}

export async function updateDoctorProfile(payload: UpdateDoctorProfilePayload) {
  const response = await apiClient.patch<UpdateDoctorProfileResponse>(
    '/hospital/doctor/profile',
    payload
  )

  return response.data
}

export async function uploadDoctorAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await apiClient.post<DoctorAvatarResponse>(
    '/hospital/doctor/profile/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data
}

export async function deleteDoctorAvatar() {
  const response = await apiClient.delete<DeleteDoctorAvatarResponse>(
    '/hospital/doctor/profile/avatar'
  )

  return response.data
}

export async function getDoctorAvailability() {
  const response = await apiClient.get<AvailabilityResponse>(
    '/hospital/doctor/availability'
  )

  return response.data
}