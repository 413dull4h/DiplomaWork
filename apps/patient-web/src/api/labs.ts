import { apiClient } from './client'

export type LabOrderStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | string

export type AnyRecord = Record<string, any>

export type PatientLabOrder = AnyRecord & {
  id: string
  status?: LabOrderStatus
  createdAt?: string
  requestedAt?: string
  reason?: string | null
  clinicalNotes?: string | null
  lab?: AnyRecord | null
  doctor?: AnyRecord | null
  orderingDoctor?: AnyRecord | null
  hospital?: AnyRecord | null
  items?: AnyRecord[]
  orderItems?: AnyRecord[]
  labOrderItems?: AnyRecord[]
  reports?: PatientLabReport[]
  labReports?: PatientLabReport[]
}

export type PatientLabReport = AnyRecord & {
  id: string
  createdAt?: string
  reportDate?: string
  summary?: string | null
  fileUrl?: string | null
  reportUrl?: string | null
  labOrder?: PatientLabOrder | null
}

export async function getPatientLabOrders() {
  const response = await apiClient.get('/patient/lab-orders')
  return (
    response.data.labOrders ??
    response.data.orders ??
    response.data.data ??
    []
  ) as PatientLabOrder[]
}

export async function getPatientLabOrder(id: string) {
  const response = await apiClient.get(`/patient/lab-orders/${id}`)
  return (
    response.data.labOrder ??
    response.data.order ??
    response.data.data
  ) as PatientLabOrder
}

export async function getPatientLabReports() {
  const response = await apiClient.get('/patient/lab-reports')
  return (
    response.data.labReports ??
    response.data.reports ??
    response.data.data ??
    []
  ) as PatientLabReport[]
}

export async function getPatientLabReport(id: string) {
  const response = await apiClient.get(`/patient/lab-reports/${id}`)
  return (
    response.data.labReport ??
    response.data.report ??
    response.data.data
  ) as PatientLabReport
}

export function patientApiFileUrl(path?: string | null) {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const apiBaseUrl =
    import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:4003'

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}