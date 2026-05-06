import { apiClient } from './client'
import type { CreateHospitalAdminInput, CreateHospitalInput, Hospital } from '@/types/models'

export async function getHospitals(): Promise<Hospital[]> {
  const { data } = await apiClient.get<{ hospitals: Hospital[] }>('/admin/hospitals')
  return data.hospitals ?? []
}

export async function getHospital(id: string): Promise<Hospital> {
  const { data } = await apiClient.get<{ hospital: Hospital }>(`/admin/hospitals/${id}`)
  return data.hospital
}

export async function createHospital(input: CreateHospitalInput): Promise<Hospital> {
  const { data } = await apiClient.post<{ message: string; hospital: Hospital }>('/admin/hospitals', input)
  return data.hospital
}

export async function approveHospital(id: string): Promise<Hospital> {
  const { data } = await apiClient.patch<{ message: string; hospital: Hospital }>(`/admin/hospitals/${id}/approve`)
  return data.hospital
}

export async function suspendHospital(id: string): Promise<Hospital> {
  const { data } = await apiClient.patch<{ message: string; hospital: Hospital }>(`/admin/hospitals/${id}/suspend`)
  return data.hospital
}

export async function rejectHospital(id: string): Promise<Hospital> {
  const { data } = await apiClient.patch<{ message: string; hospital: Hospital }>(`/admin/hospitals/${id}/reject`)
  return data.hospital
}

export async function createHospitalAdmin(hospitalId: string, input: CreateHospitalAdminInput) {
  const { data } = await apiClient.post(`/admin/hospitals/${hospitalId}/admins`, input)
  return data
}
