import { apiClient } from './client'
import type { Pagination, PlatformUser, RoleName, UserStatus } from '@/types/models'

export type UsersQuery = {
  search?: string
  status?: UserStatus | 'ALL'
  role?: RoleName | 'ALL'
  page?: number
  limit?: number
}

export type UsersResponse = {
  users: PlatformUser[]
  pagination: Pagination
}

function cleanParams(params?: UsersQuery) {
  return {
    search: params?.search || undefined,
    status: params?.status && params.status !== 'ALL' ? params.status : undefined,
    role: params?.role && params.role !== 'ALL' ? params.role : undefined,
    page: params?.page,
    limit: params?.limit,
  }
}

export async function getUsers(params?: UsersQuery): Promise<UsersResponse> {
  const { data } = await apiClient.get<UsersResponse>('/admin/users', {
    params: cleanParams(params),
  })
  return data
}

export async function getUser(id: string): Promise<PlatformUser> {
  const { data } = await apiClient.get<{ user: PlatformUser }>(`/admin/users/${id}`)
  return data.user
}

export async function suspendUser(id: string, reason?: string): Promise<PlatformUser> {
  const { data } = await apiClient.patch<{ message: string; user: PlatformUser }>(`/admin/users/${id}/suspend`, { reason })
  return data.user
}

export async function activateUser(id: string, reason?: string): Promise<PlatformUser> {
  const { data } = await apiClient.patch<{ message: string; user: PlatformUser }>(`/admin/users/${id}/activate`, { reason })
  return data.user
}
