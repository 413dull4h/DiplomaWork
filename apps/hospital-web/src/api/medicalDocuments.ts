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
  patient?: unknown
  hospital?: {
    id: string
    name: string
    logoUrl?: string | null
  } | null
  appointment?: unknown | null
  encounter?: unknown | null
}

export type UploadMedicalDocumentPayload = {
  patientId: string
  title: string
  description?: string
  type: MedicalDocumentType
  visibility: MedicalDocumentVisibility
  appointmentId?: string
  encounterId?: string
  file: File
}

export async function getHospitalPatientDocuments(patientId: string) {
  const response = await apiClient.get<{ documents: MedicalDocument[] }>(
    `/hospital/patients/${patientId}/documents`
  )

  return response.data.documents
}

export async function uploadHospitalPatientDocument(
  payload: UploadMedicalDocumentPayload
) {
  const formData = new FormData()

  formData.append('title', payload.title)
  formData.append('description', payload.description || '')
  formData.append('type', payload.type)
  formData.append('visibility', payload.visibility)

  if (payload.appointmentId) {
    formData.append('appointmentId', payload.appointmentId)
  }

  if (payload.encounterId) {
    formData.append('encounterId', payload.encounterId)
  }

  formData.append('document', payload.file)

  const response = await apiClient.post<{
    message: string
    document: MedicalDocument
  }>(`/hospital/patients/${payload.patientId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function deleteHospitalMedicalDocument(documentId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/hospital/documents/${documentId}`
  )

  return response.data
}
