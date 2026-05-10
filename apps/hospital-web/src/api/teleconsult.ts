import { apiClient } from './client'
import type { Appointment, TeleconsultSession } from '../types/models'

export type HospitalTeleconsultResponse = {
  appointment: Appointment
  teleconsultSession: TeleconsultSession | null
}

export type SaveHospitalTeleconsultLinkPayload = {
  providerType?: string
  providerName?: string
  joinUrl: string
  hostUrl?: string
}

export async function getHospitalTeleconsult(appointmentId: string) {
  const response = await apiClient.get<HospitalTeleconsultResponse>(
    `/hospital/appointments/${appointmentId}/teleconsult`
  )

  return response.data
}

export async function saveHospitalTeleconsultLink(
  appointmentId: string,
  payload: SaveHospitalTeleconsultLinkPayload
) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/appointments/${appointmentId}/teleconsult-link`, payload)

  return response.data
}

export async function startHospitalTeleconsult(appointmentId: string) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/appointments/${appointmentId}/teleconsult/start`)

  return response.data
}

export async function endHospitalTeleconsult(appointmentId: string) {
  const response = await apiClient.patch<{
    message: string
    teleconsultSession: TeleconsultSession
  }>(`/hospital/appointments/${appointmentId}/teleconsult/end`)

  return response.data
}