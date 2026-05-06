import { apiClient } from './client'
import type { AdminLoginRequest, AdminLoginResponse, AdminUser } from '@/types/models'

export async function loginAdmin(input: AdminLoginRequest): Promise<AdminLoginResponse> {
  const { data } = await apiClient.post<AdminLoginResponse>('/admin/auth/login', input)
  return data
}

export async function getAdminMe(): Promise<{ user: AdminUser }> {
  const { data } = await apiClient.get<{ user: AdminUser }>('/admin/auth/me')
  return data
}
