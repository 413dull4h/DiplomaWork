import { apiClient } from './client'
import type { AuditLog, Pagination } from '@/types/models'

export type AuditLogsQuery = {
  search?: string
  action?: string
  entityType?: string
  userId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type AuditLogsResponse = {
  auditLogs: AuditLog[]
  pagination: Pagination
  filters: {
    search: string
    action: string
    entityType: string
    userId: string
    from: string | null
    to: string | null
  }
}

function cleanParams(params?: AuditLogsQuery) {
  return {
    search: params?.search?.trim() || undefined,
    action: params?.action?.trim() || undefined,
    entityType: params?.entityType?.trim() || undefined,
    userId: params?.userId?.trim() || undefined,
    from: params?.from || undefined,
    to: params?.to || undefined,
    page: params?.page,
    limit: params?.limit,
  }
}

export async function getAuditLogs(params?: AuditLogsQuery): Promise<AuditLogsResponse> {
  const { data } = await apiClient.get<AuditLogsResponse>('/admin/audit-logs', {
    params: cleanParams(params),
  })

  return data
}

export async function getAuditLog(id: string): Promise<AuditLog> {
  const { data } = await apiClient.get<{ auditLog: AuditLog }>(`/admin/audit-logs/${id}`)
  return data.auditLog
}
