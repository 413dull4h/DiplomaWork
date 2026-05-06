import { apiClient } from './client'
import type { Pagination, PatientProfile } from '@/types/models'

export type PatientsQuery = {
  search?: string
  page?: number
  limit?: number
}

export type PatientsResponse = {
  patients: PatientProfile[]
  pagination: Pagination
}

export async function getPatients(params?: PatientsQuery): Promise<PatientsResponse> {
  const { data } = await apiClient.get<PatientsResponse>('/admin/patients', {
    params: {
      search: params?.search || undefined,
      page: params?.page,
      limit: params?.limit,
    },
  })
  return data
}

export async function getPatient(id: string): Promise<PatientProfile> {
  const { data } = await apiClient.get<{ patient: PatientProfile }>(`/admin/patients/${id}`)
  return data.patient
}
