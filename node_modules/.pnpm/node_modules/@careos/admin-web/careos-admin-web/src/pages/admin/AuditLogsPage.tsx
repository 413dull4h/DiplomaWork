import { useTranslation } from 'react-i18next'
import { AuditLogItem } from '@/components/common/AuditLogItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useDashboard } from '@/hooks/useDashboard'

export function AuditLogsPage() {
  const { t } = useTranslation(); const dashboard = useDashboard()
  if (dashboard.isLoading) return <LoadingSkeleton rows={5} />
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
  const logs = dashboard.data?.recent.auditLogs ?? []
  return <div><PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />{logs.length ? <div className="space-y-3">{logs.map((log) => <AuditLogItem key={log.id} log={log} />)}</div> : <EmptyState title={t('audit.noLogs')} />}</div>
}
