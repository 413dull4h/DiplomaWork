import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { EncounterSummary, formatDateTime } from '../appointments/appointmentUi'
import { useDoctorPatientRecords } from '../appointments/useDoctorAppointments'

export function DoctorPatientRecordsPage() {
  const { patientId = '' } = useParams()
  const recordsQuery = useDoctorPatientRecords(patientId)

  if (recordsQuery.isLoading) return <LoadingState label="Loading patient records..." />

  if (recordsQuery.isError) {
    const message = recordsQuery.error instanceof ApiError ? recordsQuery.error.message : 'Could not load patient records.'
    return <ErrorState message={message} onRetry={() => recordsQuery.refetch()} />
  }

  const records = recordsQuery.data ?? []
  const patient = records[0]?.patient

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="blue">Patient records</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {patient?.fullName ?? 'Patient records'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Only records connected to appointments assigned to your doctor account are shown here.
            </p>
          </div>

          <Link to="/appointments">
            <Button type="button" variant="secondary">Back to appointments</Button>
          </Link>
        </div>
      </Card>

      {!records.length ? (
        <EmptyState
          title="No records found"
          description="No encounters are available for this patient under your doctor account yet. Create a visit note from a confirmed appointment first."
        />
      ) : (
        <div className="space-y-5">
          {records.map((encounter) => (
            <Card key={encounter.id} elevated>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone="green">Encounter</Badge>
                <Badge>{formatDateTime(encounter.createdAt)}</Badge>
              </div>
              <EncounterSummary encounter={encounter} />
              {encounter.appointmentId ? (
                <div className="mt-4">
                  <Link to={`/appointments/${encounter.appointmentId}`}>
                    <Button type="button" variant="ghost">Open appointment</Button>
                  </Link>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
