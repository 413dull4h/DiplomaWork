import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useDoctorDashboard } from '../appointments/useDoctorAppointments'
import { AppointmentCard } from '../appointments/appointmentUi'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card elevated>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    </Card>
  )
}

export function DoctorDashboardPage() {
  const dashboardQuery = useDoctorDashboard()

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard..." />

  if (dashboardQuery.isError) {
    const message = dashboardQuery.error instanceof ApiError ? dashboardQuery.error.message : 'Could not load dashboard.'
    return <ErrorState message={message} onRetry={() => dashboardQuery.refetch()} />
  }

  const dashboard = dashboardQuery.data

  if (!dashboard) return <ErrorState message="Dashboard response was empty." />

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="blue">Doctor workspace</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Clinical dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              View today’s queue, upcoming visits, and appointment status for your hospital-scoped doctor account.
            </p>
          </div>

          <Link to="/appointments">
            <Button type="button">View appointments</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={dashboard.summary.today} />
        <StatCard label="Requested" value={dashboard.summary.requested} />
        <StatCard label="Confirmed" value={dashboard.summary.confirmed} />
        <StatCard label="Completed" value={dashboard.summary.completed} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Today’s appointments</h2>
          <Badge>{dashboard.todayAppointments.length} today</Badge>
        </div>

        {dashboard.todayAppointments.length ? (
          <div className="space-y-3">
            {dashboard.todayAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <EmptyState title="No appointments today" description="You have no assigned appointments scheduled for today." />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Upcoming appointments</h2>
          <Badge>{dashboard.upcomingAppointments.length} upcoming</Badge>
        </div>

        {dashboard.upcomingAppointments.length ? (
          <div className="space-y-3">
            {dashboard.upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming appointments" description="Confirmed or requested appointments assigned to you will appear here." />
        )}
      </section>
    </div>
  )
}
