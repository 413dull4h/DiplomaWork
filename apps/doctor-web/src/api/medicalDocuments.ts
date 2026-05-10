import { apiClient } from './client'

export type MedicalDocumentType =
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'IMAGING'
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL'
  | 'GENERAL_REPORT'
  | 'OTHER'

export type MedicalDocumentVisibility = 'PATIENT_VISIBLE' | 'HOSPITAL_ONLY'

export type MedicalDocument = {
  id: string
  patientId: string
  hospitalId: string
  uploadedByUserId: string
  appointmentId?: string | null
  encounterId?: string | null
  title: string
  description?: string | null
  type: MedicalDocumentType
  visibility: MedicalDocumentVisibility
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  fileUrl: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type UploadDoctorDocumentPayload = {
  appointmentId: string
  title: string
  description?: string
  type: MedicalDocumentType
  visibility: MedicalDocumentVisibility
  file: File
}

function getHospitalApiUrl() {
  return import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'
}

function getDoctorToken() {
  const raw = localStorage.getItem('careos-doctor-session')

  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw)
    return parsed?.state?.session?.token || ''
  } catch {
    return ''
  }
}

export async function getDoctorAppointmentDocuments(appointmentId: string) {
  const response = await apiClient.get<{ documents: MedicalDocument[] }>(
    `/hospital/doctor/appointments/${appointmentId}/documents`
  )

  return response.data.documents
}

export async function uploadDoctorAppointmentDocument(
  payload: UploadDoctorDocumentPayload
) {
  if (!payload.file) {
    throw new Error('No file selected.')
  }

  const token = getDoctorToken()

  if (!token) {
    throw new Error('Doctor session token missing. Log out and log in again.')
  }

  const formData = new FormData()

  formData.append('title', payload.title)
  formData.append('description', payload.description || '')
  formData.append('type', payload.type)
  formData.append('visibility', payload.visibility)
  formData.append('document', payload.file, payload.file.name)

  const response = await fetch(
    `${getHospitalApiUrl()}/hospital/doctor/appointments/${payload.appointmentId}/documents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Document upload failed.')
  }

  return data as {
    message: string
    document: MedicalDocument
  }
}

export async function deleteDoctorDocument(documentId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/hospital/doctor/documents/${documentId}`
  )

  return response.data
}

export function buildDoctorDocumentUrl(fileUrl: string) {
  const baseUrl = getHospitalApiUrl()

  if (!fileUrl) return '#'

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }

  return `${baseUrl}${fileUrl}`
}