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
  hospital?: {
    id: string
    name: string
    legalName?: string | null
    logoUrl?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
  } | null
  appointment?: unknown | null
  encounter?: unknown | null
}

export type DocumentsResponse = {
  documents: MedicalDocument[]
}

export type DocumentResponse = {
  document: MedicalDocument
}

export async function getPatientDocuments() {
  const response = await apiClient.get<DocumentsResponse>('/patient/documents')
  return response.data.documents
}

export async function getPatientDocument(id: string) {
  const response = await apiClient.get<DocumentResponse>(`/patient/documents/${id}`)
  return response.data.document
}