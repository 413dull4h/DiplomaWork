import { apiClient } from './client'

export type AnyRecord = Record<string, any>

export type AdminLabOrder = AnyRecord & {
  id: string
  status?: string
  createdAt?: string
  updatedAt?: string
  rawOrder?: AnyRecord
  patient?: AnyRecord | null
  lab?: AnyRecord | null
  hospital?: AnyRecord | null
  orderingDoctor?: AnyRecord | null
  items?: AnyRecord[]
  reports?: AdminLabReport[]
}

export type AdminLabReport = AnyRecord & {
  id: string
  createdAt?: string
  rawReport?: AnyRecord
  labOrder?: AnyRecord | null
  patient?: AnyRecord | null
  lab?: AnyRecord | null
  hospital?: AnyRecord | null
  orderingDoctor?: AnyRecord | null
}

export async function getAdminLabOrders() {
  const response = await apiClient.get('/admin/lab-orders')
  return (response.data.labOrders ?? []) as AdminLabOrder[]
}

export async function getAdminLabOrder(id: string) {
  const response = await apiClient.get(`/admin/lab-orders/${id}`)
  return response.data.labOrder as AdminLabOrder
}

export async function getAdminLabReports() {
  const response = await apiClient.get('/admin/lab-reports')
  return (response.data.labReports ?? []) as AdminLabReport[]
}

export async function getAdminLabReport(id: string) {
  const response = await apiClient.get(`/admin/lab-reports/${id}`)
  return response.data.labReport as AdminLabReport
}

export function adminApiFileUrl(path?: string | null) {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const apiBaseUrl = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4001'

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}
