import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuditLogItem } from '@/components/common/AuditLogItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterSelect } from '@/components/common/FilterSelect'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { formatNumber } from '@/utils/format'

const actionOptions = [
  '',
  'ADMIN_LOGIN',
  'PATIENT_LOGIN',
  'PATIENT_REGISTER',
  'HOSPITAL_LOGIN',
  'CREATE_HOSPITAL',
  'APPROVE_HOSPITAL',
  'SUSPEND_HOSPITAL',
  'REJECT_HOSPITAL',
  'CREATE_HOSPITAL_ADMIN',
  'CREATE_HOSPITAL_DEPARTMENT',
  'CREATE_HOSPITAL_DOCTOR',
  'CREATE_DOCTOR_AVAILABILITY',
  'CREATE_PATIENT_APPOINTMENT',
  'CONFIRM_HOSPITAL_APPOINTMENT',
  'CREATE_HOSPITAL_ENCOUNTER',
  'SUSPEND_USER',
  'ACTIVATE_USER',
]

const entityTypeOptions = ['', 'USER', 'PATIENT', 'HOSPITAL', 'HOSPITAL_DEPARTMENT', 'DOCTOR', 'DOCTOR_AVAILABILITY', 'APPOINTMENT', 'ENCOUNTER']
const pageSizeOptions = ['10', '25', '50', '100']

export function AuditLogsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const filters = useMemo(() => ({ search, action, entityType, userId, from, to, page, limit }), [search, action, entityType, userId, from, to, page, limit])
  const auditLogs = useAuditLogs(filters)

  const rows = auditLogs.data?.auditLogs ?? []
  const pagination = auditLogs.data?.pagination

  const resetFilters = () => {
    setSearch('')
    setAction('')
    setEntityType('')
    setUserId('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const updateAction = (value: string) => {
    setAction(value)
    setPage(1)
  }

  const updateEntityType = (value: string) => {
    setEntityType(value)
    setPage(1)
  }

  const updateUserId = (value: string) => {
    setUserId(value)
    setPage(1)
  }

  const updateFrom = (value: string) => {
    setFrom(value)
    setPage(1)
  }

  const updateTo = (value: string) => {
    setTo(value)
    setPage(1)
  }

  const updateLimit = (value: string) => {
    setLimit(Number(value))
    setPage(1)
  }

  return <div>
    <PageHeader
      title={t('audit.title')}
      subtitle={t('audit.subtitle')}
      actions={<Button variant="secondary" onClick={() => auditLogs.refetch()}>{t('common.refresh')}</Button>}
    />

    <GlassCard className="mb-5">
      <div className="grid gap-3 xl:grid-cols-[1.4fr_240px_220px_1fr]">
        <SearchInput value={search} onChange={updateSearch} />
        <FilterSelect
          ariaLabel={t('audit.action')}
          value={action}
          onChange={updateAction}
          options={actionOptions.map((value) => ({ value, label: value || t('common.all') }))}
        />
        <FilterSelect
          ariaLabel={t('audit.entityType')}
          value={entityType}
          onChange={updateEntityType}
          options={entityTypeOptions.map((value) => ({ value, label: value || t('common.all') }))}
        />
        <Input
          aria-label={t('audit.userId')}
          placeholder={t('audit.userId')}
          value={userId}
          onChange={(event) => updateUserId(event.target.value)}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
        <Input aria-label={t('audit.from')} type="date" value={from} onChange={(event) => updateFrom(event.target.value)} />
        <Input aria-label={t('audit.to')} type="date" value={to} onChange={(event) => updateTo(event.target.value)} />
        <FilterSelect
          ariaLabel={t('audit.pageSize')}
          value={String(limit)}
          onChange={updateLimit}
          options={pageSizeOptions.map((value) => ({ value, label: `${value} / ${t('audit.page')}` }))}
        />
        <Button variant="ghost" onClick={resetFilters}>{t('audit.resetFilters')}</Button>
      </div>
    </GlassCard>

    {auditLogs.isLoading ? <LoadingSkeleton rows={6} /> : null}
    {auditLogs.isError ? <ErrorState message={auditLogs.error.message} onRetry={() => auditLogs.refetch()} /> : null}

    {!auditLogs.isLoading && !auditLogs.isError ? <>
      <div className="mb-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t('audit.total')}: <span className="font-bold text-foreground">{formatNumber(pagination?.total ?? 0)}</span></p>
        {pagination ? <p>{t('audit.page')} {formatNumber(pagination.page)} / {formatNumber(Math.max(pagination.totalPages, 1))}</p> : null}
      </div>

      {rows.length ? <div className="space-y-3">{rows.map((log) => <AuditLogItem key={log.id} log={log} />)}</div> : <EmptyState title={t('audit.noLogs')} />}

      {pagination && pagination.totalPages > 1 ? <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>{t('audit.previous')}</Button>
        <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>{t('audit.next')}</Button>
      </div> : null}
    </> : null}
  </div>
}
