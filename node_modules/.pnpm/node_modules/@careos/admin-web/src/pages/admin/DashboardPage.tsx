import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { MotionGlassCard } from '@/components/common/GlassCard'
import { HospitalTable } from '@/components/common/HospitalTable'
import { AppointmentTable } from '@/components/common/AppointmentTable'
import { AuditLogItem } from '@/components/common/AuditLogItem'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'

export function DashboardPage() {
  const { t } = useTranslation()
  const dashboard = useDashboard()
  if (dashboard.isLoading) return <LoadingSkeleton rows={6} />
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
  const data = dashboard.data!
  const cards = [
    [t('dashboard.totalUsers'), data.summary.users.total, 'blue'], [t('dashboard.totalPatients'), data.summary.users.patients, 'emerald'], [t('dashboard.totalHospitals'), data.summary.hospitals.total, 'blue'], [t('dashboard.approvedHospitals'), data.summary.hospitals.approved, 'emerald'], [t('dashboard.pendingHospitals'), data.summary.hospitals.pending, 'amber'], [t('dashboard.suspendedHospitals'), data.summary.hospitals.suspended, 'red'], [t('dashboard.rejectedHospitals'), data.summary.hospitals.rejected, 'red'], [t('dashboard.totalDoctors'), data.summary.clinical.doctors, 'blue'], [t('dashboard.totalDepartments'), data.summary.clinical.departments, 'slate'], [t('dashboard.totalEncounters'), data.summary.clinical.encounters, 'emerald'], [t('dashboard.totalAppointments'), data.summary.appointments.total, 'blue'], [t('dashboard.completedAppointments'), data.summary.appointments.completed, 'emerald'],
  ] as const
  return <div><PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} actions={<><Button variant="secondary" onClick={() => dashboard.refetch()}><RefreshCw size={16} />{t('common.refresh')}</Button><Link to="/hospitals/new"><Button>{t('nav.createHospital')}</Button></Link></>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, tone]) => <StatCard key={label} label={label} value={value} tone={tone} />)}</section>
    <MotionGlassCard className="mt-6"><h2 className="mb-4 text-lg font-bold">{t('dashboard.quickActions')}</h2><div className="flex flex-wrap gap-2"><Link to="/hospitals/new"><Button>{t('nav.createHospital')}</Button></Link><Link to="/hospitals"><Button variant="secondary">{t('dashboard.reviewPending')}</Button></Link><Link to="/audit-logs"><Button variant="secondary">{t('nav.auditLogs')}</Button></Link><Link to="/appointments"><Button variant="secondary">{t('nav.appointments')}</Button></Link></div></MotionGlassCard>
    <div className="mt-6 space-y-6"><MotionGlassCard><h2 className="mb-4 text-lg font-bold">{t('dashboard.recentHospitals')}</h2>{data.recent.hospitals.length ? <HospitalTable hospitals={data.recent.hospitals} /> : <EmptyState title={t('hospitals.noHospitals')} />}</MotionGlassCard><MotionGlassCard><h2 className="mb-4 text-lg font-bold">{t('dashboard.recentAppointments')}</h2>{data.recent.appointments.length ? <AppointmentTable appointments={data.recent.appointments} /> : <EmptyState title={t('appointments.noAppointments')} />}</MotionGlassCard><MotionGlassCard><h2 className="mb-4 text-lg font-bold">{t('dashboard.recentAuditLogs')}</h2><div className="space-y-3">{data.recent.auditLogs.length ? data.recent.auditLogs.map((log) => <AuditLogItem key={log.id} log={log} />) : <EmptyState title={t('audit.noLogs')} />}</div></MotionGlassCard></div>
  </div>
}
