import { useQuery } from '@tanstack/react-query'
import { getAuditLog, getAuditLogs, type AuditLogsQuery } from '@/api/auditLogs'

export function useAuditLogs(filters: AuditLogsQuery) {
  return useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  })
}

export function useAuditLog(id?: string) {
  return useQuery({
    queryKey: ['admin-audit-log', id],
    queryFn: () => getAuditLog(id!),
    enabled: Boolean(id),
  })
}
