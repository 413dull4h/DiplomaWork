import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import type { DoctorAvailability } from '../../types/models'
import { useDoctorMe, useDoctorProfile } from './useDoctorProfile'

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return String(value)
  return parsed.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function listValue(value: string[] | string | null | undefined) {
  if (!value) return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return value
}

function ProfileCompletion({ score }: { score: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>Profile completion</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function AvailabilityRows({ availabilities }: { availabilities: DoctorAvailability[] }) {
  if (!availabilities.length) {
    return (
      <EmptyState
        title="No availability assigned"
        description="No availability has been assigned yet. Contact your hospital admin to add schedule slots."
      />
    )
  }

  return (
    <div className="space-y-3">
      {availabilities.map((slot) => (
        <div key={slot.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-950 dark:text-white">{slot.dayOfWeek}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {slot.startTime} – {slot.endTime} • {slot.slotDurationMinutes} min slots
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{slot.appointmentType}</Badge>
            <Badge tone={slot.isActive ? 'green' : 'amber'}>{slot.isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DoctorProfilePage() {
  const profileQuery = useDoctorProfile()
  const meQuery = useDoctorMe()

  if (profileQuery.isLoading) return <LoadingState label="Loading doctor profile..." />

  if (profileQuery.isError) {
    const message = profileQuery.error instanceof ApiError ? profileQuery.error.message : 'Could not load profile.'
    return <ErrorState message={message} onRetry={() => profileQuery.refetch()} />
  }

  const data = profileQuery.data
  if (!data) return <ErrorState message="Profile response was empty." />

  const { doctor, hospital, department, availabilities, hospitalDoctor } = data
  const user = doctor.user ?? meQuery.data?.user ?? null

  const completionFields = [doctor.fullName, doctor.specialization, doctor.bio, doctor.yearsExperience, doctor.consultationFee, availabilities.length]
  const completionScore = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)
  const incomplete = completionScore < 80

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <Card glass elevated className="liquid-card overflow-hidden bg-doctor-glow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone="blue">{user?.primaryRole ?? 'DOCTOR'}</Badge>
                <Badge tone={hospital.status === 'APPROVED' ? 'green' : 'amber'}>{hospital.status}</Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">{doctor.fullName}</h1>
              <p className="mt-2 text-base font-semibold text-slate-700 dark:text-slate-200">{valueOrDash(doctor.specialization)}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {hospital.name} • {department?.name ?? 'No department assigned'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/profile/edit">
                <Button type="button">Edit Profile</Button>
              </Link>
              <Link to="/schedule">
                <Button type="button" variant="secondary">View Schedule</Button>
              </Link>
            </div>
          </div>
          <div className="mt-6 max-w-lg">
            <ProfileCompletion score={completionScore} />
          </div>
        </Card>
      </motion.section>

      {incomplete ? (
        <EmptyState
          title="Your profile is incomplete"
          description="Your profile is incomplete. Add your bio, consultation fee, and experience so patients and hospital staff can understand your expertise."
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card elevated className="lg:col-span-2">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Professional Profile</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="Full name" value={doctor.fullName} />
            <Info label="Specialization" value={doctor.specialization} />
            <Info label="License number" value={doctor.licenseNumber} />
            <Info label="Years experience" value={doctor.yearsExperience ?? '—'} />
            <Info label="Consultation fee" value={money(doctor.consultationFee)} />
            <Info label="Languages" value={listValue(doctor.languages)} />
            <Info label="Qualifications" value={listValue(doctor.qualifications)} />
          </dl>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Bio</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">{valueOrDash(doctor.bio)}</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">Languages</p>
              <p className="mt-2 text-sm font-semibold text-blue-950 dark:text-blue-100">{listValue(doctor.languages)}</p>
              {!doctor.languages ? <p className="mt-2 text-xs leading-5 text-blue-700/80 dark:text-blue-200/80">Language fields appear when the backend returns them.</p> : null}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Qualifications</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{listValue(doctor.qualifications)}</p>
              {!doctor.qualifications ? <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Add backend support before enabling qualification editing.</p> : null}
            </div>
          </div>
        </Card>

        <Card elevated>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Account Info</h2>
          <dl className="mt-5 space-y-4">
            <Info label="Email" value={user?.email} />
            <Info label="Phone" value={user?.phone} />
            <Info label="Role" value={user?.primaryRole} />
            <Info label="Account status" value={user?.status} />
            <Info label="Last login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'} />
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card elevated>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Hospital Assignment</h2>
          <dl className="mt-5 space-y-4">
            <Info label="Hospital" value={hospital.name} />
            <Info label="Hospital status" value={hospital.status} />
            <Info label="Department" value={department?.name} />
            <Info label="HospitalDoctor ID" value={hospitalDoctor.id} muted />
          </dl>
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            Hospital and department assignment are controlled by hospital admin and cannot be edited from the doctor profile.
          </p>
        </Card>

        <Card elevated>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Availability Summary</h2>
            <Link to="/schedule" className="text-sm font-bold text-blue-600 hover:text-blue-700">Open schedule</Link>
          </div>
          <AvailabilityRows availabilities={availabilities} />
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value, muted = false }: { label: string; value: unknown; muted?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold ${muted ? 'break-all text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
        {valueOrDash(value)}
      </dd>
    </div>
  )
}
