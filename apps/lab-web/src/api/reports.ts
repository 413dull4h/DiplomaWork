import { apiClient, unwrapResponse } from './client'
import type { LabReport } from '../types/models'
import { listLabOrders } from './orders'

export type ReportUploadPayload = {
  orderId: string
  title: string
  summary?: string
  status: 'DRAFT' | 'FINAL' | 'CORRECTED' | 'CANCELLED'
  resultData?: string
  file: File
}

export async function uploadLabReport(payload: ReportUploadPayload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.summary) formData.append('summary', payload.summary)
  formData.append('status', payload.status)
  if (payload.resultData) formData.append('resultData', payload.resultData)
  formData.append('report', payload.file)

  const response = await apiClient.post(`/lab/orders/${payload.orderId}/reports`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResponse<LabReport>(response.data, 'report')
}

export async function listOrderReports(orderId: string) {
  const response = await apiClient.get(`/lab/orders/${orderId}/reports`)
  return unwrapResponse<LabReport[]>(response.data, 'reports') ?? []
}

export async function getLabReport(id: string) {
  const response = await apiClient.get(`/lab/reports/${id}`)
  return unwrapResponse<LabReport>(response.data, 'report')
}

export async function listLabReports() {
  const orders = await listLabOrders()
  return orders.flatMap((order) => order.reports ?? [])
}
