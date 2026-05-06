import { apiClient } from './client'
import type {
  AppointmentStatus,
  CreateEncounterPayload,
  CreateEncounterResponse,
  DoctorAppointmentResponse,
  DoctorAppointmentsResponse,
  DoctorDashboardResponse,
  PatientRecordsResponse,
} from '../types/models'

export async function getDoctorDashboard() {
  const response = await apiClient.get<DoctorDashboardResponse>('/hospital/doctor/dashboard')
  return response.data
}

export async function getDoctorAppointments(status?: AppointmentStatus | '') {
  const response = await apiClient.get<DoctorAppointmentsResponse>('/hospital/doctor/appointments', {
    params: status ? { status } : undefined,
  })
  return response.data.appointments ?? []
}

export async function getDoctorAppointment(appointmentId: string) {
  const response = await apiClient.get<DoctorAppointmentResponse>(`/hospital/doctor/appointments/${appointmentId}`)
  return response.data.appointment
}

export async function createDoctorEncounter(appointmentId: string, payload: CreateEncounterPayload) {
  const response = await apiClient.post<CreateEncounterResponse>(
    `/hospital/doctor/appointments/${appointmentId}/encounter`,
    payload,
  )
  return response.data.encounter
}

export async function getDoctorPatientRecords(patientId: string) {
  const response = await apiClient.get<PatientRecordsResponse>(`/hospital/doctor/patients/${patientId}/records`)
  return response.data.encounters ?? []
}
