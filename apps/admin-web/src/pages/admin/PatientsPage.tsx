import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { usePatients } from '@/hooks/usePatients'
import { formatDate, formatDateTime } from '@/utils/format'

export function PatientsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const filters = useMemo(() => ({ search, page: 1, limit: 50 }), [search])
  const patients = usePatients(filters)

  if (patients.isLoading) return <LoadingSkeleton rows={6} />
  if (patients.isError) return <ErrorState message={patients.error.message} onRetry={() => patients.refetch()} />

  const rows = patients.data?.patients ?? []

  return <div>
    <PageHeader
      title={t('patients.title', 'Patients')}
      subtitle={t('patients.subtitle', 'View patient profiles, account status, appointments, and encounter summaries.')}
      actions={<Button variant="secondary" onClick={() => patients.refetch()}>{t('common.refresh')}</Button>}
    />

    <div className="mb-4"><SearchInput value={search} onChange={setSearch} /></div>

    {rows.length ? <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-4">{t('patients.name', 'Patient')}</th>
              <th className="px-5 py-4">{t('auth.email', 'Email')}</th>
              <th className="px-5 py-4">{t('common.status')}</th>
              <th className="px-5 py-4">{t('patients.dateOfBirth', 'Date of birth')}</th>
              <th className="px-5 py-4">{t('appointments.title', 'Appointments')}</th>
              <th className="px-5 py-4">{t('records.title', 'Records')}</th>
              <th className="px-5 py-4">{t('common.created')}</th>
              <th className="px-5 py-4 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((patient) => <tr key={patient.id} className="transition hover:bg-white/40 dark:hover:bg-white/5">
              <td className="px-5 py-4"><p className="font-bold">{patient.fullName}</p><p className="text-xs text-muted">{patient.phone || '—'}</p></td>
              <td className="px-5 py-4 text-muted">{patient.user?.email || '—'}</td>
              <td className="px-5 py-4"><StatusBadge status={patient.user?.status} /></td>
              <td className="px-5 py-4 text-muted">{formatDate(patient.dateOfBirth)}</td>
              <td className="px-5 py-4 font-semibold">{patient._count?.appointments ?? 0}</td>
              <td className="px-5 py-4 font-semibold">{patient._count?.encounters ?? 0}</td>
              <td className="px-5 py-4 text-muted">{formatDateTime(patient.createdAt)}</td>
              <td className="px-5 py-4 text-right"><Link to={`/patients/${patient.id}`}><Button variant="secondary">{t('common.view')}</Button></Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </GlassCard> : <EmptyState title={t('patients.empty', 'No patients found.')} />}
  </div>
}
