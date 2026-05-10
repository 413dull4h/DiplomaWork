import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Trash2, Upload } from 'lucide-react'

import { useAuthStore } from '../../store/authStore'
import { getImageUrl } from '../../utils/image'
import { Avatar } from '../../components/ui/Avatar'

const PATIENT_API_URL =
  import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:4003'

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[2rem] border border-white/40 bg-white/70 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50 ${className}`}
    >
      {children}
    </div>
  )
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary:
      'bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-300 disabled:text-slate-500',
    secondary:
      'bg-white/70 text-slate-800 hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500',
  }

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-all font-bold text-slate-900 dark:text-white">
        {value || '—'}
      </dd>
    </div>
  )
}

export function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const token = useAuthStore((state) => state.token)
  const patient = useAuthStore((state) => state.patient)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)

  const [profileImageUrl, setProfileImageUrl] = useState<string | null | undefined>(
    patient?.profileImageUrl
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const chooseImage = (file?: File | null) => {
    setMessage('')
    setError('')

    if (!file) {
      return
    }

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

  const uploadAvatar = async () => {
    if (!selectedFile) {
      setError('Choose an image first.')
      return
    }

    if (!token) {
      setError('Missing patient token. Please log in again.')
      return
    }

    try {
      setIsUploading(true)
      setMessage('')
      setError('')

      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const response = await fetch(`${PATIENT_API_URL}/patient/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Profile picture upload failed.')
      }

      setProfileImageUrl(data.profileImageUrl)
      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Profile picture uploaded successfully.')

      if (setSession && token && user && data.patient) {
        setSession({
          token,
          user,
          patient: data.patient,
        })
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Profile picture upload failed.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!token) {
      setError('Missing patient token. Please log in again.')
      return
    }

    try {
      setIsDeleting(true)
      setMessage('')
      setError('')

      const response = await fetch(`${PATIENT_API_URL}/patient/profile/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Profile picture removal failed.')
      }

      setProfileImageUrl(null)
      setSelectedFile(null)
      setPreviewUrl(null)
      setMessage('Profile picture removed successfully.')

      if (setSession && token && user && data.patient) {
        setSession({
          token,
          user,
          patient: data.patient,
        })
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Profile picture removal failed.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const shownImage = previewUrl || getImageUrl(profileImageUrl)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal details and profile picture.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {shownImage ? (
                <div className="h-28 w-28 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-xl dark:border-white/10 dark:bg-white/10">
                  <img
                    src={shownImage}
                    alt="Patient profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <Avatar
                  name={patient?.fullName}
                  email={user?.email}
                  imageUrl={profileImageUrl}
                  size="xl"
                />
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg"
                aria-label="Choose profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
              {patient?.fullName || 'Patient'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {user?.email || patient?.phone || '—'}
            </p>

            <div className="mt-5 w-full rounded-3xl border border-white/40 bg-white/50 p-4 text-left dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-black text-slate-950 dark:text-white">
                Profile Picture
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG, or WEBP. Maximum 2 MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => chooseImage(event.target.files?.[0])}
              />

              {selectedFile ? (
                <p className="mt-3 truncate text-xs text-slate-500">
                  Selected: {selectedFile.name}
                </p>
              ) : null}

              {message ? (
                <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Choose
                </Button>

                <Button
                  type="button"
                  onClick={uploadAvatar}
                  disabled={!selectedFile || isUploading}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={removeAvatar}
                  disabled={!profileImageUrl || isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Patient Details
          </h2>

          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="Full name" value={patient?.fullName} />
            <Info label="Email" value={user?.email} />
            <Info label="Phone" value={patient?.phone || user?.phone} />
            <Info label="Gender" value={patient?.gender} />
            <Info label="Date of birth" value={patient?.dateOfBirth} />
            <Info label="Emergency contact" value={patient?.emergencyContactName} />
            <Info
              label="Emergency phone"
              value={patient?.emergencyContactPhone}
            />
            <Info label="Profile image URL" value={profileImageUrl} />
          </dl>

          <div className="mt-6 rounded-3xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black text-slate-950 dark:text-white">
              Medical Basics
            </p>

            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <Info label="Allergies" value={patient?.allergies} />
              <Info
                label="Current medications"
                value={patient?.currentMedications}
              />
              <Info label="Medical history" value={patient?.medicalHistory} />
            </dl>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * Placeholder page exports.
 * These keep your router from crashing if App.tsx imports these names.
 * We can upgrade each page after profile picture is done.
 */

function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This page is ready to be wired with the existing Patient API.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white"
          >
            Go to Profile
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function DashboardPage() {
  return (
    <PlaceholderPage
      title="Patient Dashboard"
      description="Overview of appointments, hospitals, and records."
    />
  )
}

export function HospitalsPage() {
  return (
    <PlaceholderPage
      title="Hospitals"
      description="Browse approved hospitals."
    />
  )
}

export function HospitalDoctorsPage() {
  return (
    <PlaceholderPage
      title="Doctors"
      description="Browse doctors under a selected hospital."
    />
  )
}

export function DoctorSlotsPage() {
  return (
    <PlaceholderPage
      title="Book Appointment"
      description="View available doctor slots and book an appointment."
    />
  )
}

export function AppointmentsPage() {
  return (
    <PlaceholderPage
      title="My Appointments"
      description="View upcoming and previous appointments."
    />
  )
}

export function AppointmentDetailsPage() {
  return (
    <PlaceholderPage
      title="Appointment Details"
      description="View appointment information."
    />
  )
}

export function RecordsPage() {
  return (
    <PlaceholderPage
      title="Medical Records"
      description="View encounter records and visit summaries."
    />
  )
}

export function RecordDetailsPage() {
  return (
    <PlaceholderPage
      title="Record Details"
      description="View one medical encounter record."
    />
  )
}

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Manage preferences and account settings."
    />
  )
}