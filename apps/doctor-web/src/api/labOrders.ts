import { apiClient } from './client'

const API_URL = import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

export type LabOrderStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | string

export type LabOrderSource = 'DOCTOR' | 'HOSPITAL' | 'PATIENT_DIRECT' | string

export type SampleCollectionType = 'IN_CENTER' | 'HOME_COLLECTION' | string

export type LabTest = {
  id: string
  labId: string
  name: string
  code?: string | null
  category?: string | null
  sampleType?: string | null
  price?: string | number | null
  turnaroundTimeHours?: number | null
  patientInstructions?: string | null
  description?: string | null
  isActive?: boolean
}

export type DoctorLab = {
  id: string
  hospitalId?: string | null
  addressId?: string | null
  name: string
  legalName?: string | null
  type?: string | null
  status?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  licenseNumber?: string | null
  accreditation?: string | null
  workingHours?: string | null
  description?: string | null
  isActive?: boolean
  tests?: LabTest[]
}

export type LabOrderItem = {
  id: string
  labOrderId: string
  labTestId: string
  testName: string
  testCode?: string | null
  price?: string | number | null
  labTest?: LabTest
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

export type LabOrder = {
  id: string
  labId: string
  patientId: string
  hospitalId?: string | null
  doctorId?: string | null
  hospitalDoctorId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
  source: LabOrderSource
  status: LabOrderStatus
  collectionType: SampleCollectionType
  requestedByUserId?: string | null
  acceptedByUserId?: string | null
  rejectedByUserId?: string | null
  reason?: string | null
  clinicalNotes?: string | null
  rejectionReason?: string | null
  scheduledAt?: string | null
  sampleCollectedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
  lab?: DoctorLab
  items?: LabOrderItem[]
  reports?: LabReport[]
  patient?: {
    id: string
    fullName: string
    phone?: string | null
  }
  hospital?: {
    id: string
    name: string
    status?: string
  }
  doctor?: {
    id: string
    fullName: string
    specialization?: string | null
  }
}

export type CreateDoctorLabOrderPayload = {
  labId: string
  testIds: string[]
  collectionType: SampleCollectionType
  reason?: string
  clinicalNotes?: string
}

export function absoluteFileUrl(url?: string | null) {
  if (!url) return '#'
  if (url.startsWith('http')) return url
  return `${API_URL}${url}`
}

export async function getDoctorLabs() {
  const response = await apiClient.get<{
    labs?: DoctorLab[]
  }>('/hospital/doctor/labs')

  return response.data.labs ?? []
}

export async function getDoctorLabTests(labId: string) {
  const response = await apiClient.get<{
    lab?: DoctorLab
    tests?: LabTest[]
  }>(`/hospital/doctor/labs/${labId}/tests`)

  return response.data.tests ?? response.data.lab?.tests ?? []
}

export async function getDoctorAppointmentLabOrders(appointmentId: string) {
  const response = await apiClient.get<{
    labOrders?: LabOrder[]
    orders?: LabOrder[]
  }>(`/hospital/doctor/appointments/${appointmentId}/lab-orders`)

  return response.data.labOrders ?? response.data.orders ?? []
}

export async function createDoctorLabOrder(
  appointmentId: string,
  payload: CreateDoctorLabOrderPayload
) {
  const response = await apiClient.post<{
    message: string
    labOrder: LabOrder
  }>(`/hospital/doctor/appointments/${appointmentId}/lab-orders`, payload)

  return response.data
}

export async function getDoctorLabReport(reportId: string) {
  const response = await apiClient.get<{
    report: LabReport
  }>(`/hospital/doctor/lab-reports/${reportId}`)

  return response.data.report
}