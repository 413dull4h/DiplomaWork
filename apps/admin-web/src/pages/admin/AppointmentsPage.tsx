import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppointmentTable } from '@/components/common/AppointmentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterSelect } from '@/components/common/FilterSelect'
import { GlassCard } from '@/components/common/GlassCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppointments } from '@/hooks/useAppointments'
import { formatNumber } from '@/utils/format'

const statusOptions = ['', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const typeOptions = ['', 'IN_PERSON', 'TELECONSULT']
const pageSizeOptions = ['10', '25', '50', '100']

export function AppointmentsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [appointmentType, setAppointmentType] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const filters = useMemo(() => ({
    search,
    status,
    appointmentType,
    hospitalId,
    doctorId,
    patientId,
    from,
    to,
    page,
    limit,
  }), [search, status, appointmentType, hospitalId, doctorId, patientId, from, to, page, limit])

  const appointments = useAppointments(filters)
  const rows = appointments.data?.appointments ?? []
  const pagination = appointments.data?.pagination

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setAppointmentType('')
    setHospitalId('')
    setDoctorId('')
    setPatientId('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const onSearch = (value: string) => { setSearch(value); setPage(1) }
  const onStatus = (value: string) => { setStatus(value); setPage(1) }
  const onType = (value: string) => { setAppointmentType(value); setPage(1) }
  const onHospitalId = (value: string) => { setHospitalId(value); setPage(1) }
  const onDoctorId = (value: string) => { setDoctorId(value); setPage(1) }
  const onPatientId = (value: string) => { setPatientId(value); setPage(1) }
  const onFrom = (value: string) => { setFrom(value); setPage(1) }
  const onTo = (value: string) => { setTo(value); setPage(1) }
  const onLimit = (value: string) => { setLimit(Number(value)); setPage(1) }

  return <div>
    <PageHeader
      title={t('appointments.title')}
      subtitle={t('appointments.subtitle')}
      actions={<Button variant="secondary" onClick={() => appointments.refetch()}>{t('common.refresh')}</Button>}
    />

    <GlassCard className="mb-5">
      <div className="grid gap-3 xl:grid-cols-[1.4fr_210px_210px_1fr]">
        <SearchInput value={search} onChange={onSearch} />
        <FilterSelect
          ariaLabel={t('appointments.statusFilter')}
          value={status}
          onChange={onStatus}
          options={statusOptions.map((value) => ({ value, label: value ? t(`status.${value}`, value) : t('common.all') }))}
        />
        <FilterSelect
          ariaLabel={t('appointments.typeFilter')}
          value={appointmentType}
          onChange={onType}
          options={typeOptions.map((value) => ({ value, label: value ? t(`status.${value}`, value) : t('common.all') }))}
        />
        <FilterSelect
          ariaLabel={t('appointments.pageSize')}
          value={String(limit)}
          onChange={onLimit}
          options={pageSizeOptions.map((value) => ({ value, label: `${value} / ${t('appointments.page')}` }))}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        <Input aria-label={t('appointments.patientId')} placeholder={t('appointments.patientId')} value={patientId} onChange={(event) => onPatientId(event.target.value)} />
        <Input aria-label={t('appointments.hospitalId')} placeholder={t('appointments.hospitalId')} value={hospitalId} onChange={(event) => onHospitalId(event.target.value)} />
        <Input aria-label={t('appointments.doctorId')} placeholder={t('appointments.doctorId')} value={doctorId} onChange={(event) => onDoctorId(event.target.value)} />
        <Input aria-label={t('appointments.from')} type="date" value={from} onChange={(event) => onFrom(event.target.value)} />
        <Input aria-label={t('appointments.to')} type="date" value={to} onChange={(event) => onTo(event.target.value)} />
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={resetFilters}>{t('appointments.resetFilters')}</Button>
      </div>
    </GlassCard>

    {appointments.isLoading ? <LoadingSkeleton rows={6} /> : null}
    {appointments.isError ? <ErrorState message={appointments.error.message} onRetry={() => appointments.refetch()} /> : null}

    {!appointments.isLoading && !appointments.isError ? <>
      <div className="mb-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t('appointments.total')}: <span className="font-bold text-foreground">{formatNumber(pagination?.total ?? 0)}</span></p>
        {pagination ? <p>{t('appointments.page')} {formatNumber(pagination.page)} / {formatNumber(Math.max(pagination.totalPages, 1))}</p> : null}
      </div>

      {rows.length ? <AppointmentTable appointments={rows} showActions /> : <EmptyState title={t('appointments.noAppointments')} />}

      {pagination && pagination.totalPages > 1 ? <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>{t('appointments.previous')}</Button>
        <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>{t('appointments.next')}</Button>
      </div> : null}
    </> : null}
  </div>
}
