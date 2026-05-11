import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardPlus,
  ExternalLink,
  FileText,
  FlaskConical,
  RefreshCw,
} from 'lucide-react'
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
import {
  useCreateDoctorLabOrder,
  useDoctorAppointmentLabOrders,
  useDoctorLabs,
  useDoctorLabTests,
} from '../../hooks/useDoctorLabOrders'
import {
  absoluteFileUrl,
  type DoctorLab,
  type LabOrder,
  type LabOrderStatus,
  type LabTest,
  type SampleCollectionType,
} from '../../api/labOrders'

function openExternalUrl(url?: string | null) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

type BadgeTone = NonNullable<Parameters<typeof Badge>[0]['tone']>

function labStatusTone(status?: string | null): BadgeTone {
  const value = String(status || '').toUpperCase()

  if (['COMPLETED'].includes(value)) return 'green'
  if (['ACCEPTED', 'SCHEDULED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(value)) {
    return 'blue'
  }
  if (['REQUESTED'].includes(value)) return 'amber'
  if (['REJECTED', 'CANCELLED', 'MISSED'].includes(value)) return 'red'

  return 'slate'
}

function money(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '—'
  return `${value}`
}

function shortDate(value?: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function LabOrderMiniCard({ order }: { order: LabOrder }) {
  const reports = order.reports ?? []

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={labStatusTone(order.status)}>{order.status}</Badge>
            <Badge tone="blue">{order.collectionType}</Badge>
            <Badge tone="slate">{order.source}</Badge>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
            {order.lab?.name || 'Lab order'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Created {shortDate(order.createdAt)}
          </p>

          {order.reason ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold">Reason:</span> {order.reason}
            </p>
          ) : null}

          {order.clinicalNotes ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold">Clinical notes:</span>{' '}
              {order.clinicalNotes}
            </p>
          ) : null}
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Tests
          </p>
          <p className="text-2xl font-black text-slate-950 dark:text-white">
            {order.items?.length ?? 0}
          </p>
        </div>
      </div>

      {order.items?.length ? (
        <div className="mt-4 grid gap-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm dark:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-black text-slate-950 dark:text-white">
                  {item.testName}
                </p>
                <p className="text-xs text-slate-500">
                  {item.testCode || 'No code'} · {item.labTest?.sampleType || 'Sample'}
                </p>
              </div>

              <p className="font-bold text-slate-700 dark:text-slate-200">
                {money(item.price)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {reports.length ? (
        <div className="mt-4 rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            <p className="font-black text-emerald-900 dark:text-emerald-100">
              Uploaded reports
            </p>
          </div>

          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-2 rounded-2xl bg-white/80 p-3 dark:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">
                    {report.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {report.status} · {shortDate(report.createdAt)}
                  </p>
                </div>

                {report.fileUrl ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openExternalUrl(absoluteFileUrl(report.fileUrl))}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TestPicker({
  tests,
  selectedTestIds,
  setSelectedTestIds,
}: {
  tests: LabTest[]
  selectedTestIds: string[]
  setSelectedTestIds: (ids: string[]) => void
}) {
  function toggle(testId: string) {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId))
      return
    }

    setSelectedTestIds([...selectedTestIds, testId])
  }

  if (!tests.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10">
        No active tests found for this lab.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tests.map((test) => {
        const checked = selectedTestIds.includes(test.id)

        return (
          <label
            key={test.id}
            className={[
              'cursor-pointer rounded-3xl border p-4 transition',
              checked
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                : 'border-slate-200 bg-white/80 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
            ].join(' ')}
          >
            <div className="flex gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(test.id)}
                className="mt-1 h-4 w-4 accent-cyan-600"
              />

              <div>
                <p className="font-black text-slate-950 dark:text-white">
                  {test.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {test.code || 'No code'} · {test.category || 'General'} ·{' '}
                  {test.sampleType || 'Sample'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Price: {money(test.price)} · TAT:{' '}
                  {test.turnaroundTimeHours
                    ? `${test.turnaroundTimeHours}h`
                    : '—'}
                </p>

                {test.patientInstructions ? (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    {test.patientInstructions}
                  </p>
                ) : null}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}

function DoctorLabOrdersPanel({
  appointmentId,
  appointmentStatus,
}: {
  appointmentId: string
  appointmentStatus: string
}) {
  const labsQuery = useDoctorLabs()
  const ordersQuery = useDoctorAppointmentLabOrders(appointmentId)
  const createLabOrder = useCreateDoctorLabOrder(appointmentId)

  const labs = labsQuery.data ?? []
  const [selectedLabId, setSelectedLabId] = useState('')
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([])
  const [collectionType, setCollectionType] =
    useState<SampleCollectionType>('IN_CENTER')
  const [reason, setReason] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedLab = useMemo<DoctorLab | undefined>(() => {
    return labs.find((lab) => lab.id === selectedLabId)
  }, [labs, selectedLabId])

  const shouldFetchTests = Boolean(selectedLabId)
  const labTestsQuery = useDoctorLabTests(selectedLabId, shouldFetchTests)

  const tests = useMemo(() => {
    const fromEndpoint = labTestsQuery.data ?? []
    const fromLab = selectedLab?.tests ?? []

    const merged = fromEndpoint.length ? fromEndpoint : fromLab

    return merged.filter((test) => test.isActive !== false)
  }, [labTestsQuery.data, selectedLab?.tests])

  const orders = ordersQuery.data ?? []

  const canOrderLabTests = ['CONFIRMED', 'COMPLETED'].includes(appointmentStatus)

  useEffect(() => {
    if (!selectedLabId && labs.length) {
      setSelectedLabId(labs[0].id)
    }
  }, [labs, selectedLabId])

  useEffect(() => {
    setSelectedTestIds([])
  }, [selectedLabId])

  async function submitLabOrder() {
    try {
      setMessage('')
      setError('')

      if (!canOrderLabTests) {
        setError('Lab orders can only be created for CONFIRMED or COMPLETED appointments.')
        return
      }

      if (!selectedLabId) {
        setError('Please select a lab.')
        return
      }

      if (!selectedTestIds.length) {
        setError('Please select at least one test.')
        return
      }

      await createLabOrder.mutateAsync({
        labId: selectedLabId,
        testIds: selectedTestIds,
        collectionType,
        reason: reason.trim() || undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
      })

      setMessage('Lab order created successfully.')
      setSelectedTestIds([])
      setReason('')
      setClinicalNotes('')
      await ordersQuery.refetch()
    } catch (caughtError) {
      setError(apiErrorMessage(caughtError, 'Failed to create lab order.'))
    }
  }

  return (
    <Card elevated className="liquid-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-600" />
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              Lab Orders
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Order tests for this patient and track lab progress from the doctor account.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={ordersQuery.isFetching}
          onClick={() => void ordersQuery.refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {!canOrderLabTests ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Lab order creation is locked until the appointment is CONFIRMED or COMPLETED.
          Current status: {appointmentStatus}.
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardPlus className="h-5 w-5 text-cyan-600" />
          <h3 className="font-black text-slate-950 dark:text-white">
            Create Lab Order
          </h3>
        </div>

        {labsQuery.isLoading ? (
          <LoadingState label="Loading labs..." />
        ) : labsQuery.isError ? (
          <ErrorState
            message={apiErrorMessage(labsQuery.error, 'Could not load labs.')}
            onRetry={() => labsQuery.refetch()}
          />
        ) : labs.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Lab
                </span>

                <select
                  value={selectedLabId}
                  onChange={(event) => setSelectedLabId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Collection type
                </span>

                <select
                  value={collectionType}
                  onChange={(event) =>
                    setCollectionType(event.target.value as SampleCollectionType)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <option value="IN_CENTER">In center</option>
                  <option value="HOME_COLLECTION">Home collection</option>
                </select>
              </label>
            </div>

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Select tests
              </p>

              {labTestsQuery.isLoading ? (
                <LoadingState label="Loading tests..." />
              ) : labTestsQuery.isError ? (
                <ErrorState
                  message={apiErrorMessage(
                    labTestsQuery.error,
                    'Could not load tests for this lab.'
                  )}
                  onRetry={() => labTestsQuery.refetch()}
                />
              ) : (
                <TestPicker
                  tests={tests}
                  selectedTestIds={selectedTestIds}
                  setSelectedTestIds={setSelectedTestIds}
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Reason
                </span>

                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Fever and weakness"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Clinical notes
                </span>

                <input
                  value={clinicalNotes}
                  onChange={(event) => setClinicalNotes(event.target.value)}
                  placeholder="Rule out infection and check blood sugar."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-600">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600">
                {message}
              </p>
            ) : null}

            <Button
              type="button"
              disabled={
                !canOrderLabTests ||
                createLabOrder.isPending ||
                labTestsQuery.isLoading
              }
              onClick={submitLabOrder}
            >
              <CheckCircle2 className="h-4 w-4" />
              {createLabOrder.isPending ? 'Creating...' : 'Create Lab Order'}
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10">
            No hospital labs are available to this doctor yet.
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="mb-4 font-black text-slate-950 dark:text-white">
          Existing Lab Orders
        </h3>

        {ordersQuery.isLoading ? (
          <LoadingState label="Loading lab orders..." />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={apiErrorMessage(
              ordersQuery.error,
              'Could not load lab orders.'
            )}
            onRetry={() => ordersQuery.refetch()}
          />
        ) : orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <LabOrderMiniCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10">
            No lab orders have been created for this appointment yet.
          </div>
        )}
      </div>
    </Card>
  )
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
        apiErrorMessage(error, 'Failed to save teleconsult link.')
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
        apiErrorMessage(error, 'Failed to start teleconsult session.')
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
        apiErrorMessage(error, 'Failed to end teleconsult session.')
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

          <DoctorLabOrdersPanel
            appointmentId={appointment.id}
            appointmentStatus={appointment.status}
          />

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