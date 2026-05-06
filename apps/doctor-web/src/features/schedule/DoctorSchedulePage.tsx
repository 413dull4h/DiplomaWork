import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useDoctorProfile } from '../profile/useDoctorProfile'
import { useDoctorAvailability } from './useDoctorAvailability'

export function DoctorSchedulePage() {
  const availabilityQuery = useDoctorAvailability()
  const profileQuery = useDoctorProfile()

  if (availabilityQuery.isLoading && profileQuery.isLoading) {
    return <LoadingState label="Loading schedule..." />
  }

  const missingEndpoint = availabilityQuery.error instanceof ApiError && availabilityQuery.error.status === 404
  const apiAvailabilities = availabilityQuery.data?.availabilities
  const profileAvailabilities = profileQuery.data?.availabilities ?? []
  const availabilities = apiAvailabilities ?? profileAvailabilities

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">Schedule</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Availability summary</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Schedule slots are assigned by hospital admin unless your backend allows doctor edits.</p>
      </Card>

      {missingEndpoint ? (
        <Card elevated className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
          <Badge tone="amber">Missing endpoint</Badge>
          <h2 className="mt-4 text-lg font-black text-amber-950 dark:text-amber-100">GET /hospital/doctor/availability is not available yet</h2>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
            The UI is not faking schedule data. It is showing availability from the profile endpoint when available. Add this backend route later if you want a dedicated schedule API.
          </p>
          <pre className="mt-4 overflow-auto rounded-2xl bg-white/70 p-4 text-xs text-amber-900 dark:bg-slate-950/70 dark:text-amber-100">{`// TODO backend route\nGET /hospital/doctor/availability\nPATCH /hospital/doctor/availability/:id`}</pre>
        </Card>
      ) : availabilityQuery.isError ? (
        <ErrorState message={availabilityQuery.error instanceof ApiError ? availabilityQuery.error.message : 'Could not load availability.'} />
      ) : null}

      {!availabilities.length ? (
        <EmptyState
          title="No availability assigned"
          description="No availability has been assigned yet. Contact your hospital admin to add schedule slots."
        />
      ) : (
        <Card elevated>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availabilities.map((slot) => (
              <div key={slot.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-950 dark:text-white">{slot.dayOfWeek}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{slot.startTime} – {slot.endTime}</p>
                  </div>
                  <Badge tone={slot.isActive ? 'green' : 'amber'}>{slot.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="blue">{slot.appointmentType}</Badge>
                  <Badge>{slot.slotDurationMinutes} min</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
