import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterSelect } from '@/components/common/FilterSelect'
import { GlassCard } from '@/components/common/GlassCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useUsers } from '@/hooks/useUsers'
import { formatDateTime } from '@/utils/format'
import type { RoleName, UserStatus } from '@/types/models'

const statuses: Array<UserStatus | 'ALL'> = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED']
const roles: Array<RoleName | 'ALL'> = ['ALL', 'PLATFORM_ADMIN', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'HOSPITAL_STAFF', 'PATIENT']

export function UsersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL')
  const [role, setRole] = useState<RoleName | 'ALL'>('ALL')
  const filters = useMemo(() => ({ search, status, role, page: 1, limit: 50 }), [search, status, role])
  const users = useUsers(filters)

  if (users.isLoading) return <LoadingSkeleton rows={6} />
  if (users.isError) return <ErrorState message={users.error.message} onRetry={() => users.refetch()} />

  const rows = users.data?.users ?? []

  return <div>
    <PageHeader
      title={t('users.title', 'Users')}
      subtitle={t('users.subtitle', 'Search, inspect, suspend, and reactivate platform accounts.')}
      actions={<Button variant="secondary" onClick={() => users.refetch()}>{t('common.refresh')}</Button>}
    />

    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_240px]">
      <SearchInput value={search} onChange={setSearch} />
      <FilterSelect ariaLabel={t('common.status')} value={status} onChange={(value) => setStatus(value as UserStatus | 'ALL')} options={statuses.map((value) => ({ value, label: value === 'ALL' ? t('common.all') : t(`status.${value}`, value) }))} />
      <FilterSelect ariaLabel={t('users.role', 'Role')} value={role} onChange={(value) => setRole(value as RoleName | 'ALL')} options={roles.map((value) => ({ value, label: value === 'ALL' ? t('common.all') : t(`status.${value}`, value) }))} />
    </div>

    {rows.length ? <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-4">{t('users.email', 'Email')}</th>
              <th className="px-5 py-4">{t('users.role', 'Role')}</th>
              <th className="px-5 py-4">{t('common.status')}</th>
              <th className="px-5 py-4">{t('users.linkedProfile', 'Linked profile')}</th>
              <th className="px-5 py-4">{t('auth.session', 'Session')}</th>
              <th className="px-5 py-4 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((user) => <tr key={user.id} className="transition hover:bg-white/40 dark:hover:bg-white/5">
              <td className="px-5 py-4"><p className="font-bold">{user.email}</p><p className="text-xs text-muted">{user.phone || '—'}</p></td>
              <td className="px-5 py-4"><StatusBadge status={user.primaryRole} /></td>
              <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
              <td className="px-5 py-4 text-muted">{user.patient?.fullName || user.orgStaff?.[0]?.hospital?.name || '—'}</td>
              <td className="px-5 py-4 text-muted">{formatDateTime(user.lastLoginAt)}</td>
              <td className="px-5 py-4 text-right"><Link to={`/users/${user.id}`}><Button variant="secondary">{t('common.view')}</Button></Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </GlassCard> : <EmptyState title={t('users.empty', 'No users found.')} />}
  </div>
}
