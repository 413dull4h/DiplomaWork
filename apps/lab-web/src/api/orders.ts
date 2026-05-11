import { apiClient, unwrapResponse } from './client'
import type { LabOrder, LabOrderStatus } from '../types/models'

export async function listLabOrders(params?: { status?: LabOrderStatus }) {
  const response = await apiClient.get('/lab/orders', { params })
  return unwrapResponse<LabOrder[]>(response.data, 'orders') ?? []
}

export async function getLabOrder(id: string) {
  const response = await apiClient.get(`/lab/orders/${id}`)
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function acceptLabOrder(id: string) {
  const response = await apiClient.patch(`/lab/orders/${id}/accept`)
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function rejectLabOrder(id: string, rejectionReason?: string) {
  const response = await apiClient.patch(`/lab/orders/${id}/reject`, { rejectionReason })
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function markSampleCollected(id: string) {
  const response = await apiClient.patch(`/lab/orders/${id}/sample-collected`)
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function markInProgress(id: string) {
  const response = await apiClient.patch(`/lab/orders/${id}/in-progress`)
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function completeLabOrder(id: string) {
  const response = await apiClient.patch(`/lab/orders/${id}/complete`)
  return unwrapResponse<LabOrder>(response.data, 'order')
}

export async function updateLabOrderStatus(id: string, status: LabOrderStatus, rejectionReason?: string) {
  switch (status) {
    case 'ACCEPTED':
      return acceptLabOrder(id)
    case 'REJECTED':
      return rejectLabOrder(id, rejectionReason)
    case 'SAMPLE_COLLECTED':
      return markSampleCollected(id)
    case 'IN_PROGRESS':
      return markInProgress(id)
    case 'COMPLETED':
      return completeLabOrder(id)
    default:
      throw new Error(`No backend action exists for changing order to ${status}.`)
  }
}
