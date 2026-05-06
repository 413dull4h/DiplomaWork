import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useActivateUser, useSuspendUser, useUser } from '@/hooks/useUsers'
import { formatDateTime, metadataPreview } from '@/utils/format'

export function UserDetailsPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const userQuery = useUser(id)
  const suspend = useSuspendUser()
  const activate = useActivateUser()
  const [confirm, setConfirm] = useState<'suspend' | 'activate' | null>(null)

  if (userQuery.isLoading) return <LoadingSkeleton rows={6} />
  if (userQuery.isError) return <ErrorState message={userQuery.error.message} onRetry={() => userQuery.refetch()} />
  const user = userQuery.data
  if (!user) return <EmptyState title={t('users.notFound', 'User not found.')} />

  const runAction = () => {
    if (!confirm) return
    const payload = { id: user.id, reason: `Admin ${confirm} action from careOS Admin Web` }
    const mutation = confirm === 'suspend' ? suspend : activate
    mutation.mutate(payload, { onSettled: () => setConfirm(null) })
  }

  return <div>
    <PageHeader
      title={user.email}
      subtitle={t('users.detailSubtitle', 'Account, role, activity, and linked platform profile.')}
      actions={<><BackButton />{user.status === 'SUSPENDED' ? <Button variant="success" onClick={() => setConfirm('activate')}>{t('users.activate', 'Activate')}</Button> : <Button variant="danger" onClick={() => setConfirm('suspend')}>{t('users.suspend', 'Suspend')}</Button>}</>}
    />

    <div className="grid gap-5 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{t('users.identity', 'Identity')}</h2><div className="flex gap-2"><StatusBadge status={user.primaryRole} /><StatusBadge status={user.status} /></div></div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label={t('users.email', 'Email')} value={user.email} />
          <Info label={t('users.phone', 'Phone')} value={user.phone} />
          <Info label={t('users.lastLogin', 'Last login')} value={formatDateTime(user.lastLoginAt)} />
          <Info label={t('common.created')} value={formatDateTime(user.createdAt)} />
          <Info label={t('common.updated')} value={formatDateTime(user.updatedAt)} />
          <Info label="ID" value={user.id} />
        </dl>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-bold">{t('users.linkedProfile', 'Linked profile')}</h2>
        {user.patient ? <div className="space-y-3"><p className="font-bold">{user.patient.fullName}</p><p className="text-sm text-muted">{t('nav.patients', 'Patients')}</p><Link to={`/patients/${user.patient.id}`}><Button variant="secondary" className="w-full">{t('common.view')}</Button></Link></div> : user.orgStaff?.length ? <div className="space-y-3">{user.orgStaff.map((staff) => <div key={staff.id} className="rounded-2xl bg-white/50 p-3 dark:bg-white/10"><p className="font-bold">{staff.hospital?.name || '—'}</p><p className="text-sm text-muted">{staff.staffRole}</p></div>)}</div> : <EmptyState title={t('common.empty')} />}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-bold">{t('users.roles', 'Roles')}</h2>
        {user.userRoles?.length ? <div className="flex flex-wrap gap-2">{user.userRoles.map((item) => <StatusBadge key={item.id} status={item.role.name} />)}</div> : <EmptyState title={t('common.empty')} />}
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold">{t('audit.title', 'Audit Logs')}</h2>
        {user.auditLogs?.length ? <div className="space-y-3">{user.auditLogs.map((log) => <div key={log.id} className="rounded-2xl bg-white/50 p-3 dark:bg-white/10"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{log.action}</p><p className="text-xs text-muted">{formatDateTime(log.createdAt)}</p></div><p className="mt-1 text-xs text-muted">{log.entityType} · {log.entityId || '—'}</p><p className="mt-2 text-xs text-muted">{metadataPreview(log.metadata)}</p></div>)}</div> : <EmptyState title={t('audit.empty', 'No audit logs found.')} />}
      </GlassCard>
    </div>

    <ConfirmDialog
      open={Boolean(confirm)}
      title={confirm === 'activate' ? t('users.activateQuestion', 'Activate this user?') : t('users.suspendQuestion', 'Suspend this user?')}
      onCancel={() => setConfirm(null)}
      onConfirm={runAction}
      loading={suspend.isPending || activate.isPending}
    />
  </div>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words font-semibold">{value || '—'}</dd></div>
}
