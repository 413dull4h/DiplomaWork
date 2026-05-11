import { apiClient } from './client'

export type LabStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
export type LabType = 'INTERNAL' | 'INDEPENDENT' | 'PARTNER'

export type Address = {
  id: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
  latitude?: number | null
  longitude?: number | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type LabDocumentType =
  | 'LICENSE'
  | 'ACCREDITATION'
  | 'TAX_DOCUMENT'
  | 'OWNERSHIP_DOCUMENT'
  | 'COMPLIANCE_CERTIFICATE'
  | 'OTHER'

export type LabDocument = {
  id: string
  labId: string
  uploadedByUserId: string
  title: string
  description?: string | null
  type: LabDocumentType
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  fileUrl: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type LabStaff = {
  id: string
  userId: string
  labId: string
  staffRole: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  user?: {
    id: string
    email: string
    phone?: string | null
    primaryRole: string
    status: string
  }
}

export type LabTest = {
  id: string
  labId: string
  name: string
  code: string
  category: string
  sampleType: string
  price?: string | number | null
  turnaroundTimeHours?: number | null
  patientInstructions?: string | null
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type LabOrder = {
  id: string
  labId: string
  patientId: string
  hospitalId?: string | null
  doctorId?: string | null
  hospitalDoctorId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
  status: string
  source: string
  collectionType: string
  reason?: string | null
  clinicalNotes?: string | null
  rejectionReason?: string | null
  scheduledAt?: string | null
  sampleCollectedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export type LabReport = {
  id: string
  labOrderId: string
  labId: string
  patientId: string
  hospitalId?: string | null
  doctorId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
  uploadedByUserId?: string | null
  title: string
  summary?: string | null
  status: string
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  fileUrl?: string | null
  resultData?: unknown
  finalizedAt?: string | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export type HospitalLab = {
  id: string
  hospitalId?: string | null
  addressId?: string | null
  address?: Address | null
  name: string
  legalName?: string | null
  type: LabType
  status: LabStatus
  contactPhone?: string | null
  contactEmail?: string | null
  licenseNumber?: string | null
  accreditation?: string | null
  workingHours?: string | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  staff?: LabStaff[]
  tests?: LabTest[]
  orders?: LabOrder[]
  reports?: LabReport[]
  documents?: LabDocument[]
}

export type LabAddressPayload = {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  latitude?: number
  longitude?: number
}

export type CreateLabPayload = {
  name: string
  legalName?: string
  contactEmail?: string
  contactPhone?: string
  licenseNumber?: string
  accreditation?: string
  workingHours?: string
  description?: string
  address?: LabAddressPayload
}

export type UpdateLabPayload = Partial<
  Omit<CreateLabPayload, 'address'>
> & {
  isActive?: boolean
  address?: Partial<LabAddressPayload>
}

export type CreateLabAdminPayload = {
  email: string
  password: string
  phone?: string
}

export type UploadLabDocumentPayload = {
  title: string
  description?: string
  type: LabDocumentType
  document: File
}

export async function getHospitalLabs() {
  const response = await apiClient.get<{ labs: HospitalLab[] }>('/hospital/labs')
  return response.data.labs
}

export async function getHospitalLab(id: string) {
  const response = await apiClient.get<{ lab: HospitalLab }>(
    `/hospital/labs/${id}`
  )
  return response.data.lab
}

export async function createHospitalLab(payload: CreateLabPayload) {
  const response = await apiClient.post<{ message: string; lab: HospitalLab }>(
    '/hospital/labs',
    payload
  )
  return response.data
}

export async function updateHospitalLab(id: string, payload: UpdateLabPayload) {
  const response = await apiClient.patch<{ message: string; lab: HospitalLab }>(
    `/hospital/labs/${id}`,
    payload
  )
  return response.data
}

export async function createHospitalLabAdmin(
  labId: string,
  payload: CreateLabAdminPayload
) {
  const response = await apiClient.post<{
    message: string
    labAdmin: {
      userId: string
      email: string
      staffId: string
      labId: string
    }
  }>(`/hospital/labs/${labId}/admins`, payload)

  return response.data
}

export async function uploadHospitalLabDocument(
  labId: string,
  payload: UploadLabDocumentPayload
) {
  const formData = new FormData()

  formData.append('title', payload.title)
  formData.append('description', payload.description ?? '')
  formData.append('type', payload.type)
  formData.append('document', payload.document)

  const response = await apiClient.post<{
    message: string
    document: LabDocument
  }>(`/hospital/labs/${labId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function getHospitalLabDocuments(labId: string) {
  const response = await apiClient.get<{ documents: LabDocument[] }>(
    `/hospital/labs/${labId}/documents`
  )

  return response.data.documents
}

export async function deleteHospitalLabDocument(
  labId: string,
  documentId: string
) {
  const response = await apiClient.delete<{ message: string }>(
    `/hospital/labs/${labId}/documents/${documentId}`
  )

  return response.data
}