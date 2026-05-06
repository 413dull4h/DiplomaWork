import { apiClient } from './client'
import type { AdminAppointment, Pagination } from '@/types/models'

export type AppointmentsQuery = {
  search?: string
  status?: string
  appointmentType?: string
  hospitalId?: string
  doctorId?: string
  patientId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type AppointmentsResponse = {
  appointments: AdminAppointment[]
  pagination: Pagination
  filters: {
    search: string
    status: string
    appointmentType: string
    hospitalId: string
    doctorId: string
    patientId: string
    from: string | null
    to: string | null
  }
}

function cleanParams(params?: AppointmentsQuery) {
  return {
    search: params?.search?.trim() || undefined,
    status: params?.status?.trim() || undefined,
    appointmentType: params?.appointmentType?.trim() || undefined,
    hospitalId: params?.hospitalId?.trim() || undefined,
    doctorId: params?.doctorId?.trim() || undefined,
    patientId: params?.patientId?.trim() || undefined,
    from: params?.from || undefined,
    to: params?.to || undefined,
    page: params?.page,
    limit: params?.limit,
  }
}

export async function getAppointments(params?: AppointmentsQuery): Promise<AppointmentsResponse> {
  const { data } = await apiClient.get<AppointmentsResponse>('/admin/appointments', {
    params: cleanParams(params),
  })

  return data
}

export async function getAppointment(id: string): Promise<AdminAppointment> {
  const { data } = await apiClient.get<{ appointment: AdminAppointment }>(`/admin/appointments/${id}`)
  return data.appointment
}
