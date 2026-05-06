import { apiClient } from './client'
import type { DashboardResponse } from '@/types/models'

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>('/admin/dashboard')
  return data
}
