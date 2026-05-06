import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { Appointment, AppointmentStatus, Encounter, Patient } from '../../types/models'

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '—'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return `${start} – ${end}`
  return `${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(startDate)} · ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(startDate)} – ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(endDate)}`
}

export function statusTone(status?: string) {
  if (status === 'CONFIRMED' || status === 'COMPLETED' || status === 'ACTIVE') return 'green'
  if (status === 'REQUESTED') return 'amber'
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'rose'
  return 'slate'
}

export function Detail({ label, value }: { label: string; value?: unknown }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{value ? String(value) : '—'}</dd>
    </div>
  )
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card elevated className="transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone={statusTone(appointment.status)}>{appointment.status}</Badge>
            <Badge tone="blue">{appointment.appointmentType}</Badge>
          </div>
          <h3 className="truncate text-xl font-black text-slate-950 dark:text-white">
            {appointment.patient?.fullName ?? 'Patient'}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {appointment.department?.name ?? 'Department not assigned'}{appointment.reason ? ` • ${appointment.reason}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/appointments/${appointment.id}`}>
            <Button type="button" variant="secondary">Open</Button>
          </Link>
          {appointment.patientId ? (
            <Link to={`/patients/${appointment.patientId}/records`}>
              <Button type="button" variant="ghost">Records</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export function PatientSummary({ patient }: { patient?: Patient | null }) {
  if (!patient) return null

  return (
    <Card elevated>
      <h2 className="text-lg font-black text-slate-950 dark:text-white">Patient overview</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Detail label="Full name" value={patient.fullName} />
        <Detail label="Email" value={patient.user?.email} />
        <Detail label="Phone" value={patient.phone ?? patient.user?.phone} />
        <Detail label="Gender" value={patient.gender} />
        <Detail label="Date of birth" value={patient.dateOfBirth ? formatDateTime(patient.dateOfBirth) : undefined} />
        <Detail label="Emergency contact" value={[patient.emergencyContactName, patient.emergencyContactPhone].filter(Boolean).join(' · ')} />
      </dl>

      <div className="mt-5 grid gap-3">
        <ClinicalNote label="Allergies" value={patient.allergies} tone="rose" />
        <ClinicalNote label="Current medications" value={patient.currentMedications} tone="blue" />
        <ClinicalNote label="Medical history" value={patient.medicalHistory} tone="slate" />
      </div>
    </Card>
  )
}

function ClinicalNote({ label, value, tone }: { label: string; value?: string | null; tone: 'rose' | 'blue' | 'slate' }) {
  const styles = {
    rose: 'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
    blue: 'border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100',
    slate: 'border-slate-200 bg-slate-50/80 text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100',
  }

  return (
    <div className={`rounded-2xl border p-4 ${styles[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || '—'}</p>
    </div>
  )
}

export function EncounterSummary({ encounter }: { encounter?: Encounter | null }) {
  if (!encounter) return null

  return (
    <Card elevated className="border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20">
      <Badge tone="green">Encounter created</Badge>
      <h2 className="mt-4 text-lg font-black text-emerald-950 dark:text-emerald-100">
        {encounter.diagnosis || 'Visit note'}
      </h2>
      <div className="mt-4 grid gap-3">
        <ClinicalNote label="Chief complaint" value={encounter.chiefComplaint} tone="slate" />
        <ClinicalNote label="Notes" value={encounter.notes} tone="slate" />
        <ClinicalNote label="Prescription" value={encounter.prescription} tone="blue" />
        <ClinicalNote label="Follow-up" value={encounter.followUpInstructions} tone="slate" />
      </div>
    </Card>
  )
}
