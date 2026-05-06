import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterSelect } from '@/components/common/FilterSelect'
import { HospitalTable } from '@/components/common/HospitalTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApproveHospital, useHospitals, useRejectHospital, useSuspendHospital } from '@/hooks/useHospitals'
import type { HospitalStatus } from '@/types/models'

export function HospitalsPage() {
  const { t } = useTranslation(); const [search, setSearch] = useState(''); const [status, setStatus] = useState('ALL'); const [confirm, setConfirm] = useState<{id: string; action: 'approve'|'suspend'|'reject'} | null>(null)
  const hospitals = useHospitals(); const approve = useApproveHospital(); const suspend = useSuspendHospital(); const reject = useRejectHospital()
  const filtered = useMemo(() => (hospitals.data ?? []).filter((h) => {
    const haystack = [h.name, h.legalName, h.contactEmail, h.licenseNumber, h.address?.city].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase()) && (status === 'ALL' || h.status === status)
  }), [hospitals.data, search, status])
  const runAction = () => { if (!confirm) return; const map = { approve, suspend, reject }; map[confirm.action].mutate(confirm.id, { onSettled: () => setConfirm(null) }) }
  if (hospitals.isLoading) return <LoadingSkeleton rows={5} />
  if (hospitals.isError) return <ErrorState message={hospitals.error.message} onRetry={() => hospitals.refetch()} />
  return <div><PageHeader title={t('hospitals.title')} subtitle={t('hospitals.subtitle')} actions={<Link to="/hospitals/new"><Button>{t('hospitals.new')}</Button></Link>} /><div className="mb-4 grid gap-3 md:grid-cols-[1fr_240px]"><SearchInput value={search} onChange={setSearch} /><FilterSelect ariaLabel={t('common.filter')} value={status} onChange={setStatus} options={[{value:'ALL', label:t('common.all')}, ...(['APPROVED','PENDING','SUSPENDED','REJECTED'] as HospitalStatus[]).map(s => ({ value: s, label: t(`status.${s}`) }))]} /></div>{filtered.length ? <HospitalTable hospitals={filtered} onAction={(id, action) => setConfirm({ id, action })} /> : <EmptyState title={t('hospitals.noHospitals')} />}<ConfirmDialog open={Boolean(confirm)} title={confirm ? t(`hospitals.${confirm.action}Question`) : ''} onCancel={() => setConfirm(null)} onConfirm={runAction} loading={approve.isPending || suspend.isPending || reject.isPending} /></div>
}
