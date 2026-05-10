import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { DoctorMedicalDocumentsPanel } from '../../components/documents/DoctorMedicalDocumentsPanel'
import {
  Detail,
  EncounterSummary,
  PatientSummary,
  formatDateTime,
  formatTimeRange,
  statusTone,
} from './appointmentUi'
import { useDoctorAppointment } from './useDoctorAppointments'
import {
  useDoctorTeleconsult,
  useEndDoctorTeleconsult,
  useSaveDoctorTeleconsultLink,
  useStartDoctorTeleconsult,
} from '../../hooks/useDoctorTeleconsult'

function openExternalUrl(url?: string | null) {
  if (!url) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export function DoctorAppointmentDetailsPage() {
  const { appointmentId = '' } = useParams()

  const appointmentQuery = useDoctorAppointment(appointmentId)
  const teleconsultQuery = useDoctorTeleconsult(appointmentId)
  const saveTeleconsult = useSaveDoctorTeleconsultLink(appointmentId)
  const startTeleconsult = useStartDoctorTeleconsult(appointmentId)
  const endTeleconsult = useEndDoctorTeleconsult(appointmentId)

  const [providerName, setProviderName] = useState('Yandex Telemost')
  const [joinUrl, setJoinUrl] = useState('https://telemost.yandex.ru/j/123456789')
  const [hostUrl, setHostUrl] = useState('https://telemost.yandex.ru/j/123456789')
  const [teleconsultError, setTeleconsultError] = useState('')
  const [teleconsultMessage, setTeleconsultMessage] = useState('')

  const appointment = appointmentQuery.data
  const session =
    teleconsultQuery.data?.teleconsultSession ||
    appointment?.teleconsultSession ||
    null

  useEffect(() => {
    if (session) {
      setProviderName(session.providerName || '')
      setJoinUrl(session.joinUrl || '')
      setHostUrl(session.hostUrl || '')
    }
  }, [session?.id, session?.providerName, session?.joinUrl, session?.hostUrl])

  if (appointmentQuery.isLoading) {
    return <LoadingState label="Loading appointment..." />
  }

  if (appointmentQuery.isError) {
    const message =
      appointmentQuery.error instanceof ApiError
        ? appointmentQuery.error.message
        : 'Could not load appointment.'

    return (
      <ErrorState message={message} onRetry={() => appointmentQuery.refetch()} />
    )
  }

  if (!appointment) {
    return <ErrorState message="Appointment response was empty." />
  }

  async function saveMeetingLink() {
    try {
      setTeleconsultError('')
      setTeleconsultMessage('')

      if (!joinUrl.trim()) {
        setTeleconsultError('Join URL is required.')
        return
      }

      await saveTeleconsult.mutateAsync({
        providerType: 'CUSTOM_URL',
        providerName: providerName.trim() || 'Custom meeting link',
        joinUrl: joinUrl.trim(),
        hostUrl: hostUrl.trim() || undefined,
      })

      setTeleconsultMessage('Meeting link saved successfully.')
      await appointmentQuery.refetch()
      await teleconsultQuery.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to save teleconsult link.'
      )
    }
  }

  async function startMeeting() {
    try {
      setTeleconsultError('')
      setTeleconsultMessage('')

      await startTeleconsult.mutateAsync()
      setTeleconsultMessage('Teleconsult session started.')
      await appointmentQuery.refetch()
      await teleconsultQuery.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to start teleconsult session.'
      )
    }
  }

  async function endMeeting() {
    try {
      setTeleconsultError('')
      setTeleconsultMessage('')

      await endTeleconsult.mutateAsync()
      setTeleconsultMessage('Teleconsult session ended.')
      await appointmentQuery.refetch()
      await teleconsultQuery.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to end teleconsult session.'
      )
    }
  }

  const isTeleconsult = appointment.appointmentType === 'TELECONSULT'
  const isSessionEnded = session?.status === 'ENDED'
  const canControlTeleconsult =
    isTeleconsult &&
    ['REQUESTED', 'CONFIRMED'].includes(appointment.status)

  return (
    <div className="space-y-6">
      <Card glass elevated className="liquid-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={statusTone(appointment.status)}>
                {appointment.status}
              </Badge>

              <Badge tone="blue">{appointment.appointmentType}</Badge>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {appointment.patient?.fullName ?? 'Patient appointment'}
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {formatTimeRange(
                appointment.scheduledStart,
                appointment.scheduledEnd
              )}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {appointment.hospital?.name ?? 'Hospital'} •{' '}
              {appointment.department?.name ?? 'Department'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/appointments">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>

            {appointment.patientId ? (
              <Link to={`/patients/${appointment.patientId}/records`}>
                <Button type="button" variant="ghost">
                  Patient records
                </Button>
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

      {isTeleconsult ? (
        <Card elevated className="border-sky-200 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Badge tone="blue">Teleconsultation</Badge>

              <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                {session?.providerName || 'Meeting link not set'}
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Status:{' '}
                <span className="font-black">
                  {session?.status || 'PENDING'}
                </span>
              </p>

              <p className="mt-2 break-all text-sm text-slate-500">
                {session?.joinUrl || 'No meeting URL has been added yet.'}
              </p>

              {!canControlTeleconsult ? (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-200">
                  Meeting controls are available only for REQUESTED or CONFIRMED
                  teleconsult appointments.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {session?.joinUrl ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSessionEnded}
                  onClick={() => openExternalUrl(session.joinUrl)}
                >
                  {isSessionEnded ? 'Session ended' : 'Join'}
                </Button>
              ) : null}

              <Button
                type="button"
                disabled={
                  !session?.id ||
                  !canControlTeleconsult ||
                  startTeleconsult.isPending
                }
                onClick={startMeeting}
              >
                {startTeleconsult.isPending ? 'Starting...' : 'Start'}
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={
                  !session?.id ||
                  !canControlTeleconsult ||
                  endTeleconsult.isPending
                }
                onClick={endMeeting}
              >
                {endTeleconsult.isPending ? 'Ending...' : 'End'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Provider name
              </span>
              <input
                value={providerName}
                onChange={(event) => setProviderName(event.target.value)}
                placeholder="Yandex Telemost"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Join URL
              </span>
              <input
                value={joinUrl}
                onChange={(event) => setJoinUrl(event.target.value)}
                placeholder="https://telemost.yandex.ru/j/123456789"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Host URL optional
              </span>
              <input
                value={hostUrl}
                onChange={(event) => setHostUrl(event.target.value)}
                placeholder="https://telemost.yandex.ru/j/123456789"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>
          </div>

          {teleconsultError ? (
            <p className="mt-4 text-sm font-semibold text-rose-600">
              {teleconsultError}
            </p>
          ) : null}

          {teleconsultMessage ? (
            <p className="mt-4 text-sm font-semibold text-emerald-600">
              {teleconsultMessage}
            </p>
          ) : null}

          <Button
            type="button"
            className="mt-5"
            disabled={!canControlTeleconsult || saveTeleconsult.isPending}
            onClick={saveMeetingLink}
          >
            {saveTeleconsult.isPending ? 'Saving...' : 'Save Meeting Link'}
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <PatientSummary patient={appointment.patient} />
          <EncounterSummary encounter={appointment.encounter} />

          <DoctorMedicalDocumentsPanel
            appointmentId={appointment.id}
            appointmentStatus={appointment.status}
          />
        </div>

        <div className="space-y-6">
          <Card elevated>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Appointment details
            </h2>

            <dl className="mt-5 grid gap-4">
              <Detail label="Status" value={appointment.status} />
              <Detail
                label="Appointment type"
                value={appointment.appointmentType}
              />
              <Detail
                label="Scheduled start"
                value={formatDateTime(appointment.scheduledStart)}
              />
              <Detail
                label="Scheduled end"
                value={formatDateTime(appointment.scheduledEnd)}
              />
              <Detail label="Reason" value={appointment.reason} />
              <Detail
                label="Cancellation reason"
                value={appointment.cancellationReason}
              />
              <Detail label="Doctor" value={appointment.doctor?.fullName} />
              <Detail label="Department" value={appointment.department?.name} />

              {isTeleconsult ? (
                <>
                  <Detail
                    label="Meeting provider"
                    value={session?.providerName || '—'}
                  />
                  <Detail label="Meeting status" value={session?.status || '—'} />
                </>
              ) : null}
            </dl>
          </Card>

          {appointment.status !== 'CONFIRMED' && !appointment.encounter ? (
            <Card
              elevated
              className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30"
            >
              <Badge tone="amber">Visit note locked</Badge>

              <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                Only CONFIRMED appointments can create an encounter. Current
                status: {appointment.status}.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}