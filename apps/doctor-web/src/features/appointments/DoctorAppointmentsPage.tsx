import { useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import type { AppointmentStatus } from '../../types/models'
import { AppointmentCard } from './appointmentUi'
import { useDoctorAppointments } from './useDoctorAppointments'

const statuses: Array<AppointmentStatus | ''> = ['', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export function DoctorAppointmentsPage() {
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [search, setSearch] = useState('')
  const appointmentsQuery = useDoctorAppointments(status)

  const rows = useMemo(() => {
    return (appointmentsQuery.data ?? []).filter((appointment) => {
      const haystack = `${appointment.patient?.fullName ?? ''} ${appointment.reason ?? ''} ${appointment.department?.name ?? ''} ${appointment.status}`.toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [appointmentsQuery.data, search])

  if (appointmentsQuery.isLoading) return <LoadingState label="Loading appointments..." />

  if (appointmentsQuery.isError) {
    const message = appointmentsQuery.error instanceof ApiError ? appointmentsQuery.error.message : 'Could not load appointments.'
    return <ErrorState message={message} onRetry={() => appointmentsQuery.refetch()} />
  }

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <Badge tone="blue">Assigned to you</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Appointments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          These are hospital appointments assigned to your doctor profile only. You cannot see unrelated hospital appointments here.
        </p>
      </Card>

      <Card elevated>
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <Input
            label="Search appointments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patient, reason, department..."
          />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AppointmentStatus | '')}
              className="focus-ring w-full rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
            >
              {statuses.map((item) => (
                <option key={item || 'ALL'} value={item}>
                  {item || 'ALL'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <EmptyState title="No appointments found" description="Try a different status filter or search term." />
      )}
    </div>
  )
}
