import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Detail, EncounterSummary, PatientSummary, formatDateTime, formatTimeRange, statusTone } from './appointmentUi'
import { useDoctorAppointment } from './useDoctorAppointments'

export function DoctorAppointmentDetailsPage() {
  const { appointmentId = '' } = useParams()
  const appointmentQuery = useDoctorAppointment(appointmentId)

  if (appointmentQuery.isLoading) return <LoadingState label="Loading appointment..." />

  if (appointmentQuery.isError) {
    const message = appointmentQuery.error instanceof ApiError ? appointmentQuery.error.message : 'Could not load appointment.'
    return <ErrorState message={message} onRetry={() => appointmentQuery.refetch()} />
  }

  const appointment = appointmentQuery.data

  if (!appointment) return <ErrorState message="Appointment response was empty." />

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(appointment.status)}>{appointment.status}</Badge>
              <Badge tone="blue">{appointment.appointmentType}</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {appointment.patient?.fullName ?? 'Patient appointment'}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {appointment.hospital?.name ?? 'Hospital'} • {appointment.department?.name ?? 'Department'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/appointments">
              <Button type="button" variant="secondary">Back</Button>
            </Link>
            {appointment.patientId ? (
              <Link to={`/patients/${appointment.patientId}/records`}>
                <Button type="button" variant="ghost">Patient records</Button>
              </Link>
            ) : null}
            {appointment.status === 'CONFIRMED' && !appointment.encounter ? (
              <Link to={`/appointments/${appointment.id}/encounter`}>
                <Button type="button">Create visit note</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <PatientSummary patient={appointment.patient} />
          <EncounterSummary encounter={appointment.encounter} />
        </div>

        <div className="space-y-6">
          <Card elevated>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Appointment details</h2>
            <dl className="mt-5 grid gap-4">
              <Detail label="Status" value={appointment.status} />
              <Detail label="Appointment type" value={appointment.appointmentType} />
              <Detail label="Scheduled start" value={formatDateTime(appointment.scheduledStart)} />
              <Detail label="Scheduled end" value={formatDateTime(appointment.scheduledEnd)} />
              <Detail label="Reason" value={appointment.reason} />
              <Detail label="Cancellation reason" value={appointment.cancellationReason} />
              <Detail label="Doctor" value={appointment.doctor?.fullName} />
              <Detail label="Department" value={appointment.department?.name} />
            </dl>
          </Card>

          {appointment.status !== 'CONFIRMED' && !appointment.encounter ? (
            <Card elevated className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
              <Badge tone="amber">Visit note locked</Badge>
              <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                Only CONFIRMED appointments can create an encounter. Current status: {appointment.status}.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
