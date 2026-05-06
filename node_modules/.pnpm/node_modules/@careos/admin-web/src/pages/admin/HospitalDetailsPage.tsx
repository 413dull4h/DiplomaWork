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
import { useApproveHospital, useHospital, useRejectHospital, useSuspendHospital } from '@/hooks/useHospitals'
import { addressSummary, formatDateTime } from '@/utils/format'

export function HospitalDetailsPage() {
  const { id } = useParams(); const { t } = useTranslation(); const hospital = useHospital(id); const approve = useApproveHospital(); const suspend = useSuspendHospital(); const reject = useRejectHospital()
  if (hospital.isLoading) return <LoadingSkeleton rows={5} />
  if (hospital.isError) return <ErrorState message={hospital.error.message} onRetry={() => hospital.refetch()} />
  const h = hospital.data
  if (!h) return <EmptyState title={t('common.empty')} />
  return <div><PageHeader title={h.name} subtitle={t('hospitals.detailTitle')} actions={<><BackButton /><Link to={`/hospitals/${h.id}/create-admin`}><Button>{t('hospitals.createAdmin')}</Button></Link></>} /><div className="grid gap-5 lg:grid-cols-3"><GlassCard className="lg:col-span-2"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{t('hospitals.identity')}</h2><StatusBadge status={h.status} /></div><dl className="mt-5 grid gap-4 md:grid-cols-2"><Info label={t('hospitals.legalName')} value={h.legalName} /><Info label={t('hospitals.licenseNumber')} value={h.licenseNumber} /><Info label={t('hospitals.contactEmail')} value={h.contactEmail} /><Info label={t('hospitals.contactPhone')} value={h.contactPhone} /><Info label={t('hospitals.timeZone')} value={h.timeZone} /><Info label={t('hospitals.address')} value={addressSummary(h.address)} /><Info label={t('common.created')} value={formatDateTime(h.createdAt)} /><Info label={t('common.updated')} value={formatDateTime(h.updatedAt)} /></dl></GlassCard><GlassCard><h2 className="mb-4 text-xl font-bold">{t('common.actions')}</h2><div className="space-y-2"><Button className="w-full" variant="success" onClick={() => approve.mutate(h.id)}>{t('common.approve')}</Button><Button className="w-full" variant="secondary" onClick={() => suspend.mutate(h.id)}>{t('common.suspend')}</Button><Button className="w-full" variant="danger" onClick={() => reject.mutate(h.id)}>{t('common.reject')}</Button></div></GlassCard><GlassCard><h2 className="mb-4 text-xl font-bold">{t('hospitals.departments')}</h2>{h.departments?.length ? <ul className="space-y-2">{h.departments.map((d) => <li className="rounded-2xl bg-white/50 p-3 dark:bg-white/10" key={d.id}><p className="font-bold">{d.name}</p><p className="text-sm text-muted">{d.description}</p></li>)}</ul> : <EmptyState title={t('common.empty')} />}</GlassCard><GlassCard className="lg:col-span-2"><h2 className="mb-4 text-xl font-bold">{t('hospitals.staff')}</h2>{h.staff?.length ? <div className="space-y-2">{h.staff.map((s) => <div key={s.id} className="rounded-2xl bg-white/50 p-3 dark:bg-white/10"><p className="font-bold">{s.user?.email}</p><p className="text-sm text-muted">{s.staffRole}</p></div>)}</div> : <EmptyState title={t('common.empty')} />}</GlassCard></div></div>
}
function Info({ label, value }: { label: string; value?: string | null }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 font-semibold">{value || '—'}</dd></div> }
