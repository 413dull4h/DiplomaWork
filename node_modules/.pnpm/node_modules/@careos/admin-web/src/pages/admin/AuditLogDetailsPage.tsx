import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuditLog } from '@/hooks/useAuditLogs'
import { formatDateTime } from '@/utils/format'

export function AuditLogDetailsPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const auditLogQuery = useAuditLog(id)

  if (auditLogQuery.isLoading) return <LoadingSkeleton rows={6} />
  if (auditLogQuery.isError) return <ErrorState message={auditLogQuery.error.message} onRetry={() => auditLogQuery.refetch()} />

  const log = auditLogQuery.data
  if (!log) return <EmptyState title={t('audit.notFound')} />

  return <div>
    <PageHeader
      title={t('audit.detailTitle')}
      subtitle={`${log.action} · ${formatDateTime(log.createdAt)}`}
      actions={<BackButton />}
    />

    <div className="grid gap-5 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t('common.details')}</h2>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={log.entityType} />
            {log.user?.primaryRole ? <StatusBadge status={log.user.primaryRole} /> : null}
          </div>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label={t('audit.action')} value={log.action} />
          <Info label={t('audit.entityType')} value={log.entityType} />
          <Info label={t('audit.entityId')} value={log.entityId} />
          <Info label={t('audit.timestamp')} value={formatDateTime(log.createdAt)} />
          <Info label={t('audit.ipAddress')} value={log.ipAddress} />
          <Info label="ID" value={log.id} />
        </dl>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-bold">{t('audit.actor')}</h2>
        {log.user ? <div className="space-y-3">
          <p className="break-words font-bold">{log.user.email}</p>
          <div className="flex flex-wrap gap-2"><StatusBadge status={log.user.primaryRole} /><StatusBadge status={log.user.status} /></div>
          <p className="text-sm text-muted">{t('users.lastLogin', 'Last login')}: {formatDateTime(log.user.lastLoginAt)}</p>
          <Link to={`/users/${log.user.id}`}><Button variant="secondary" className="w-full">{t('common.view')}</Button></Link>
        </div> : <EmptyState title={t('audit.system')} />}
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t('audit.rawMetadata')}</h2>
          <p className="text-sm text-muted">{t('audit.metadataHelp')}</p>
        </div>
        {log.metadata ? <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950/90 p-4 text-xs leading-6 text-slate-100">{JSON.stringify(log.metadata, null, 2)}</pre> : <EmptyState title={t('audit.noMetadata')} />}
      </GlassCard>
    </div>
  </div>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
    <dd className="mt-1 break-words font-semibold">{value || '—'}</dd>
  </div>
}
