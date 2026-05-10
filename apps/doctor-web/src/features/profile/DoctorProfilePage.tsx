import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Trash2, Upload } from 'lucide-react'

import { ApiError } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import type { DoctorAvailability } from '../../types/models'
import {
  useDeleteDoctorAvatar,
  useDoctorMe,
  useDoctorProfile,
  useUploadDoctorAvatar,
} from './useDoctorProfile'

const HOSPITAL_API_URL =
  import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

function getDoctorImageUrl(path?: string | null) {
  if (!path) return null

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${HOSPITAL_API_URL}${path}`
}

function getInitials(name?: string | null) {
  if (!name) return 'DR'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'

  const parsed = Number(value)

  if (Number.isNaN(parsed)) return String(value)

  return parsed.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
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
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function AvailabilityRows({
  availabilities,
}: {
  availabilities: DoctorAvailability[]
}) {
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
        <div
          key={slot.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-bold text-slate-950 dark:text-white">
              {slot.dayOfWeek}
            </p>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {slot.startTime} – {slot.endTime} • {slot.slotDurationMinutes} min
              slots
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{slot.appointmentType}</Badge>
            <Badge tone={slot.isActive ? 'green' : 'amber'}>
              {slot.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DoctorProfilePage() {
  const profileQuery = useDoctorProfile()
  const meQuery = useDoctorMe()
  const uploadAvatarMutation = useUploadDoctorAvatar()
  const deleteAvatarMutation = useDeleteDoctorAvatar()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading doctor profile..." />
  }

  if (profileQuery.isError) {
    const profileError =
      profileQuery.error instanceof ApiError
        ? profileQuery.error.message
        : 'Could not load profile.'

    return (
      <ErrorState
        message={profileError}
        onRetry={() => profileQuery.refetch()}
      />
    )
  }

  const data = profileQuery.data

  if (!data) {
    return <ErrorState message="Profile response was empty." />
  }

  const { doctor, hospital, department, availabilities, hospitalDoctor } = data
  const user = doctor.user ?? meQuery.data?.user ?? null

  const currentImageUrl = getDoctorImageUrl(doctor.profileImageUrl)
  const shownImage = previewUrl || currentImageUrl

  const completionFields = [
    doctor.fullName,
    doctor.specialization,
    doctor.bio,
    doctor.yearsExperience,
    doctor.consultationFee,
    availabilities.length,
  ]

  const completionScore = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  )

  const incomplete = completionScore < 80

  function chooseImage(file?: File | null) {
    setMessage('')
    setError('')

    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadAvatar() {
    if (!selectedFile) {
      setError('Choose an image first.')
      return
    }

    try {
      setMessage('')
      setError('')

      await uploadAvatarMutation.mutateAsync(selectedFile)

      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Doctor profile picture uploaded successfully.')
      await profileQuery.refetch()
    } catch (uploadError) {
      const uploadMessage =
        uploadError instanceof Error
          ? uploadError.message
          : 'Profile picture upload failed.'

      setError(uploadMessage)
    }
  }

  async function removeAvatar() {
    try {
      setMessage('')
      setError('')

      await deleteAvatarMutation.mutateAsync()

      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Doctor profile picture removed successfully.')
      await profileQuery.refetch()
    } catch (deleteError) {
      const deleteMessage =
        deleteError instanceof Error
          ? deleteError.message
          : 'Profile picture removal failed.'

      setError(deleteMessage)
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <Card glass elevated className="liquid-card overflow-hidden bg-doctor-glow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center sm:items-start">
                <div className="relative">
                  {shownImage ? (
                    <div className="h-28 w-28 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-xl dark:border-white/10 dark:bg-white/10">
                      <img
                        src={shownImage}
                        alt="Doctor profile"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/40 bg-gradient-to-br from-blue-100 to-cyan-100 text-2xl font-black text-blue-900 shadow-xl dark:border-white/10 dark:from-slate-800 dark:to-slate-950 dark:text-white">
                      {getInitials(doctor.fullName)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg"
                    aria-label="Choose doctor profile picture"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => chooseImage(event.target.files?.[0])}
                />
              </div>

              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge tone="blue">{user?.primaryRole ?? 'DOCTOR'}</Badge>
                  <Badge tone={hospital.status === 'APPROVED' ? 'green' : 'amber'}>
                    {hospital.status}
                  </Badge>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                  {doctor.fullName}
                </h1>

                <p className="mt-2 text-base font-semibold text-slate-700 dark:text-slate-200">
                  {valueOrDash(doctor.specialization)}
                </p>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {hospital.name} • {department?.name ?? 'No department assigned'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/profile/edit">
                <Button type="button">Edit Profile</Button>
              </Link>

              <Link to="/schedule">
                <Button type="button" variant="secondary">
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 max-w-lg">
            <ProfileCompletion score={completionScore} />
          </div>
        </Card>
      </motion.section>

      <Card elevated>
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Profile Picture
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              JPG, PNG, or WEBP. Maximum 2 MB.
            </p>

            {selectedFile ? (
              <p className="mt-3 truncate text-xs font-semibold text-slate-500">
                Selected: {selectedFile.name}
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Choose Image
              </Button>

              <Button
                type="button"
                disabled={!selectedFile || uploadAvatarMutation.isPending}
                onClick={uploadAvatar}
              >
                <Upload className="h-4 w-4" />
                {uploadAvatarMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={!doctor.profileImageUrl || deleteAvatarMutation.isPending}
                onClick={removeAvatar}
              >
                <Trash2 className="h-4 w-4" />
                {deleteAvatarMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>

            {message ? (
              <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </p>
            ) : null}

            <p className="mt-4 break-all text-xs text-slate-500 dark:text-slate-400">
              Current image URL: {doctor.profileImageUrl || '—'}
            </p>
          </div>
        </div>
      </Card>

      {incomplete ? (
        <EmptyState
          title="Your profile is incomplete"
          description="Your profile is incomplete. Add your bio, consultation fee, and experience so patients and hospital staff can understand your expertise."
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card elevated className="lg:col-span-2">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Professional Profile
          </h2>

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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Bio
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
              {valueOrDash(doctor.bio)}
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                Languages
              </p>

              <p className="mt-2 text-sm font-semibold text-blue-950 dark:text-blue-100">
                {listValue(doctor.languages)}
              </p>

              {!doctor.languages ? (
                <p className="mt-2 text-xs leading-5 text-blue-700/80 dark:text-blue-200/80">
                  Language fields appear when the backend returns them.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Qualifications
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {listValue(doctor.qualifications)}
              </p>

              {!doctor.qualifications ? (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Add backend support before enabling qualification editing.
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <Card elevated>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Account Info
          </h2>

          <dl className="mt-5 space-y-4">
            <Info label="Email" value={user?.email} />
            <Info label="Phone" value={user?.phone} />
            <Info label="Role" value={user?.primaryRole} />
            <Info label="Account status" value={user?.status} />
            <Info
              label="Last login"
              value={
                user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : '—'
              }
            />
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card elevated>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Hospital Assignment
          </h2>

          <dl className="mt-5 space-y-4">
            <Info label="Hospital" value={hospital.name} />
            <Info label="Hospital status" value={hospital.status} />
            <Info label="Department" value={department?.name} />
            <Info label="HospitalDoctor ID" value={hospitalDoctor.id} muted />
          </dl>

          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            Hospital and department assignment are controlled by hospital admin
            and cannot be edited from the doctor profile.
          </p>
        </Card>

        <Card elevated>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Availability Summary
            </h2>

            <Link
              to="/schedule"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Open schedule
            </Link>
          </div>

          <AvailabilityRows availabilities={availabilities} />
        </Card>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
  muted = false,
}: {
  label: string
  value: unknown
  muted?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>

      <dd
        className={`mt-1 text-sm font-semibold ${
          muted
            ? 'break-all text-slate-500 dark:text-slate-400'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {valueOrDash(value)}
      </dd>
    </div>
  )
}