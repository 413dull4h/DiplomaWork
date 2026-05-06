import { useTranslation } from 'react-i18next'
import { AppointmentTable } from '@/components/common/AppointmentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useDashboard } from '@/hooks/useDashboard'

export function AppointmentsPage() {
  const { t } = useTranslation(); const dashboard = useDashboard()
  if (dashboard.isLoading) return <LoadingSkeleton rows={5} />
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
  const appointments = dashboard.data?.recent.appointments ?? []
  return <div><PageHeader title={t('appointments.title')} subtitle={t('appointments.subtitle')} />{appointments.length ? <AppointmentTable appointments={appointments} /> : <EmptyState title={t('appointments.noAppointments')} />}</div>
}
