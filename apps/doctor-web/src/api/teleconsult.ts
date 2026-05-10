import { apiClient } from './client'
import type { Appointment, TeleconsultSession } from '../types/models'

export type DoctorTeleconsultResponse = {
  appointment: Appointment
  teleconsultSession: TeleconsultSession | null
}

export type SaveTeleconsultLinkPayload = {
  providerType?: string
  providerName?: string
  joinUrl: string
  hostUrl?: string
}

export async function getDoctorTeleconsult(appointmentId: string) {
  const response = await apiClient.get<DoctorTeleconsultResponse>(
    `/hospital/doctor/appointments/${appointmentId}/teleconsult`
  )

  return response.data
}

export async function saveDoctorTeleconsultLink(
  appointmentId: string,
  payload: SaveTeleconsultLinkPayload
) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/doctor/appointments/${appointmentId}/teleconsult-link`, payload)

  return response.data
}

export async function startDoctorTeleconsult(appointmentId: string) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/doctor/appointments/${appointmentId}/teleconsult/start`)

  return response.data
}

export async function endDoctorTeleconsult(appointmentId: string) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/doctor/appointments/${appointmentId}/teleconsult/end`)

  return response.data
}