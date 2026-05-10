import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  CalendarDays,
  Camera,
  ClipboardList,
  RefreshCw,
  Stethoscope,
  Trash2,
  Upload,
} from 'lucide-react'

import {
  useDoctorReviews,
  useHospitalReviews,
  useHospitalReviewSummary,
} from '../../hooks/useReviews'

import { useHospitalProfile } from '../../hooks/useHospitalProfile'
import { useDepartments, useCreateDepartment } from '../../hooks/useDepartments'
import { useDoctors, useCreateDoctor } from '../../hooks/useDoctors'
import { DoctorAccountPanel } from '../../components/doctors/DoctorAccountPanel'
import { MedicalDocumentsPanel } from '../../components/documents/MedicalDocumentsPanel'
import {
  useDoctorAvailability,
  useCreateDoctorAvailability,
  useUpdateDoctorAvailability,
  useDeleteDoctorAvailability,
} from '../../hooks/useAvailability'
import {
  useHospitalAppointments,
  useHospitalAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useCompleteAppointment,
  useNoShowAppointment,
} from '../../hooks/useAppointments'
import {
  useHospitalTeleconsult,
  useSaveHospitalTeleconsultLink,
  useStartHospitalTeleconsult,
  useEndHospitalTeleconsult,
} from '../../hooks/useHospitalTeleconsult'
import {
  useCreateEncounter,
  useEncounter,
  useUpdateEncounter,
  usePatientRecords,
} from '../../hooks/useEncounters'
import { useHealth } from '../../hooks/useHealth'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { HospitalLogo } from '../../components/ui/HospitalLogo'
import {
  ActionLink,
  BackButton,
  DateTime,
  EmptyState,
  Err,
  ErrorState,
  Field,
  GlassCard,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
  StatusBadge,
  TimeRange,
} from '../../components/common/Basic'
import { LanguageSwitcher, ThemeToggle } from '../../components/layout/Layout'
import type {
  AppointmentStatus,
  AvailabilityAppointmentType,
  DayOfWeek,
  DoctorAvailability,
} from '../../types/models'
import { timeOk } from '../../utils/format'

const HOSPITAL_API_URL =
  import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

function FormPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <PageHeader title={title} actions={<BackButton />} />
      <GlassCard className="max-w-3xl">{children}</GlassCard>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-bold dark:text-white">
        {value || '—'}
      </dd>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon?: ReactNode
}) {
  return (
    <GlassCard>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black dark:text-white">{value}</p>
        </div>

        {icon ? <div className="text-cyan-600">{icon}</div> : null}
      </div>
    </GlassCard>
  )
}

function ListAppointments({ title, rows }: { title: string; rows: any[] }) {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mb-3 font-black dark:text-white">{title}</h3>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((appointment) => (
            <AppointmentRow key={appointment.id} a={appointment} />
          ))
        ) : (
          <GlassCard>{t('appointments.noAppointments')}</GlassCard>
        )}
      </div>
    </div>
  )
}

function AppointmentRow({ a }: { a: any }) {
  const { t } = useTranslation()

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex gap-2">
            <StatusBadge value={a.status} />
            <StatusBadge value={a.appointmentType} />
          </div>

          <h3 className="mt-2 font-black dark:text-white">
            {a.patient?.fullName || '—'}
          </h3>

          <p className="text-sm text-slate-500">
            {a.doctor?.fullName || '—'} · {a.department?.name || '—'}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            <TimeRange start={a.scheduledStart} end={a.scheduledEnd} />
          </p>
        </div>

        <ActionLink to={`/appointments/${a.id}`} label={t('common.view')} />
      </div>
    </GlassCard>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const p = useHospitalProfile()
  const d = useDepartments()
  const doc = useDoctors()
  const ap = useHospitalAppointments()
  const rows = ap.data ?? []

  if (p.isLoading || d.isLoading || doc.isLoading || ap.isLoading) {
    return <LoadingSkeleton />
  }

  if (p.error || d.error || doc.error || ap.error) {
    return <ErrorState />
  }

  const c = (status: AppointmentStatus) => {
    return rows.filter((appointment) => appointment.status === status).length
  }

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              void p.refetch()
              void d.refetch()
              void doc.refetch()
              void ap.refetch()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        }
      />

      <div className="space-y-6">
        <GlassCard>
          <div className="flex gap-4">
            <HospitalLogo
              name={p.data?.name}
              logoUrl={p.data?.logoUrl}
              size="lg"
            />

            <div>
              <div className="flex flex-wrap gap-2">
                <h2 className="text-2xl font-black dark:text-white">
                  {p.data?.name}
                </h2>
                <StatusBadge value={p.data?.status} />
              </div>

              <p className="text-sm text-slate-500">
                {p.data?.contactEmail} · {p.data?.contactPhone}
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label={t('dashboard.totalDepartments')}
            value={d.data?.length ?? 0}
            icon={<ClipboardList />}
          />
          <Stat
            label={t('dashboard.totalDoctors')}
            value={doc.data?.length ?? 0}
            icon={<Stethoscope />}
          />
          <Stat
            label={t('dashboard.totalAppointments')}
            value={rows.length}
            icon={<CalendarDays />}
          />
          <Stat
            label={t('dashboard.today')}
            value={
              rows.filter(
                (appointment) =>
                  new Date(appointment.scheduledStart).toDateString() ===
                  new Date().toDateString()
              ).length
            }
            icon={<Building2 />}
          />
          <Stat label={t('dashboard.requested')} value={c('REQUESTED')} />
          <Stat label={t('dashboard.confirmed')} value={c('CONFIRMED')} />
          <Stat label={t('dashboard.completed')} value={c('COMPLETED')} />
          <Stat label={t('dashboard.noShow')} value={c('NO_SHOW')} />
        </div>

        <GlassCard>
          <h3 className="mb-3 font-black dark:text-white">
            {t('dashboard.quickActions')}
          </h3>

          <div className="flex flex-wrap gap-2">
            <ActionLink
              to="/departments/new"
              label={t('dashboard.createDepartment')}
            />
            <ActionLink to="/doctors/new" label={t('dashboard.addDoctor')} />
            <ActionLink
              to="/appointments"
              label={t('dashboard.viewAppointments')}
            />
          </div>
        </GlassCard>

        <ListAppointments
          title={t('dashboard.upcoming')}
          rows={rows
            .filter(
              (appointment) =>
                new Date(appointment.scheduledStart).getTime() > Date.now()
            )
            .slice(0, 5)}
        />
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { t } = useTranslation()
  const p = useHospitalProfile()
  const token = useAuthStore((state) => state.token)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const h = p.data

  const chooseLogo = (file?: File | null) => {
    setMsg('')
    setErr('')

    if (!file) {
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setErr('Only JPG, PNG, and WEBP images are allowed.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErr('Image must be 2 MB or smaller.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadLogo = async () => {
    if (!selectedFile) {
      setErr('Choose a logo image first.')
      return
    }

    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    try {
      setIsUploading(true)
      setErr('')
      setMsg('')

      const formData = new FormData()
      formData.append('logo', selectedFile)

      const response = await fetch(`${HOSPITAL_API_URL}/hospital/profile/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Logo upload failed.')
      }

      setSelectedFile(null)
      setPreviewUrl(null)
      setMsg('Hospital logo uploaded successfully.')
      void p.refetch()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Logo upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteLogo = async () => {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    try {
      setIsDeleting(true)
      setErr('')
      setMsg('')

      const response = await fetch(`${HOSPITAL_API_URL}/hospital/profile/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Logo removal failed.')
      }

      setSelectedFile(null)
      setPreviewUrl(null)
      setMsg('Hospital logo removed successfully.')
      void p.refetch()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Logo removal failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        actions={<BackButton />}
      />

      {p.isLoading ? (
        <LoadingSkeleton />
      ) : p.error || !h ? (
        <ErrorState />
      ) : (
        <div className="space-y-5">
          <GlassCard>
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  {previewUrl ? (
                    <div className="h-24 w-24 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-lg dark:border-white/10 dark:bg-white/10">
                      <img
                        src={previewUrl}
                        alt="Hospital logo preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <HospitalLogo name={h.name} logoUrl={h.logoUrl} size="xl" />
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg"
                    aria-label="Choose hospital logo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => chooseLogo(event.target.files?.[0])}
                />

                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Choose Logo
                  </Button>

                  <Button
                    type="button"
                    onClick={uploadLogo}
                    disabled={!selectedFile || isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={deleteLogo}
                    disabled={!h.logoUrl || isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black dark:text-white">
                    {h.name}
                  </h2>
                  <StatusBadge value={h.status} />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {h.contactEmail} · {h.contactPhone}
                </p>

                <div className="mt-4 rounded-3xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-black dark:text-white">
                    Hospital Logo
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG, or WEBP. Maximum 2 MB.
                  </p>

                  {selectedFile ? (
                    <p className="mt-3 truncate text-xs text-slate-500">
                      Selected: {selectedFile.name}
                    </p>
                  ) : null}

                  {msg ? (
                    <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {msg}
                    </p>
                  ) : null}

                  {err ? (
                    <p className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
                      {err}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <dl className="grid gap-4 md:grid-cols-2">
              <Info label={t('profile.legalName')} value={h.legalName} />
              <Info
                label={t('profile.licenseNumber')}
                value={h.licenseNumber}
              />
              <Info label={t('profile.timeZone')} value={h.timeZone} />
              <Info label="Logo URL" value={h.logoUrl} />
              <Info
                label={t('profile.address')}
                value={[h.address?.line1, h.address?.city, h.address?.country]
                  .filter(Boolean)
                  .join(', ')}
              />
              <Info
                label={t('profile.departmentsSummary')}
                value={String(h.departments?.length ?? 0)}
              />
            </dl>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export function DepartmentsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const d = useDepartments()
  const docs = useDoctors()

  const rows = (d.data ?? []).filter((department) =>
    `${department.name} ${department.description ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title={t('departments.title')}
        subtitle={t('departments.subtitle')}
        actions={
          <ActionLink
            to="/departments/new"
            label={t('departments.newTitle')}
          />
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
        />
      </div>

      {d.isLoading ? (
        <LoadingSkeleton />
      ) : d.error ? (
        <ErrorState />
      ) : rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((department) => (
            <GlassCard key={department.id}>
              <h3 className="font-black dark:text-white">{department.name}</h3>

              <p className="mt-1 text-sm text-slate-500">
                {department.description || t('common.none')}
              </p>

              <p className="mt-4 text-xs text-slate-500">
                {t('departments.doctorCount')}:{' '}
                {
                  (docs.data ?? []).filter(
                    (doctor) => doctor.departmentId === department.id
                  ).length
                }
              </p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title={t('departments.noDepartments')} />
      )}
    </div>
  )
}

export function CreateDepartmentPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const m = useCreateDepartment()

  const schema = z.object({
    name: z.string().min(2, t('validation.required')),
    description: z.string().optional(),
  })

  const f = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  return (
    <FormPage title={t('departments.newTitle')}>
      <form
        className="space-y-4"
        onSubmit={f.handleSubmit(async (values) => {
          await m.mutateAsync(values)
          nav('/departments')
        })}
      >
        <Field
          label={t('departments.name')}
          error={f.formState.errors.name?.message}
        >
          <Input {...f.register('name')} />
        </Field>

        <Field label={t('departments.description')}>
          <Textarea {...f.register('description')} />
        </Field>

        {m.error ? <Err e={m.error} /> : null}

        <Button disabled={m.isPending}>{t('common.save')}</Button>
      </form>
    </FormPage>
  )
}

export function DoctorsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [dep, setDep] = useState('')
  const doctors = useDoctors()
  const deps = useDepartments()

  const rows = (doctors.data ?? []).filter((doctorItem) => {
    const haystack = `${doctorItem.doctor.fullName} ${doctorItem.doctor.specialization ?? ''
      } ${doctorItem.doctor.licenseNumber ?? ''}`.toLowerCase()

    return (
      haystack.includes(search.toLowerCase()) &&
      (!dep || doctorItem.departmentId === dep)
    )
  })

  return (
    <div>
      <PageHeader
        title={t('doctors.title')}
        subtitle={t('doctors.subtitle')}
        actions={<ActionLink to="/doctors/new" label={t('doctors.newTitle')} />}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_260px]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
        />

        <Select value={dep} onChange={(event) => setDep(event.target.value)}>
          <option value="">{t('common.all')}</option>
          {(deps.data ?? []).map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      </div>

      {doctors.isLoading ? (
        <LoadingSkeleton />
      ) : doctors.error ? (
        <ErrorState />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((doctorItem) => (
            <DoctorRow key={doctorItem.id} item={doctorItem} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('doctors.noDoctors')} />
      )}
    </div>
  )
}

function DoctorRow({ item }: { item: any }) {
  const { t } = useTranslation()

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
        <div>
          <h3 className="font-black dark:text-white">
            {item.doctor.fullName}
          </h3>

          <p className="text-sm text-slate-500">
            {item.doctor.specialization || '—'} · {item.department?.name || '—'}
          </p>

          <p className="text-xs text-slate-500">
            {item.doctor.licenseNumber || '—'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
          <ActionLink to={`/doctors/${item.id}`} label={t('common.view')} />
          <ActionLink
            to={`/doctors/${item.id}/availability`}
            label={t('doctors.manageAvailability')}
          />
        </div>
      </div>
    </GlassCard>
  )
}

export function CreateDoctorPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const m = useCreateDoctor()
  const deps = useDepartments()

  const schema = z.object({
    fullName: z.string().min(2),
    specialization: z.string().optional(),
    licenseNumber: z.string().optional(),
    yearsExperience: z.coerce.number().min(0).optional(),
    bio: z.string().optional(),
    consultationFee: z.coerce.number().min(0).optional(),
    departmentId: z.string().optional(),
  })

  const f = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  return (
    <FormPage title={t('doctors.newTitle')}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={f.handleSubmit(async (values) => {
          await m.mutateAsync(values)
          nav('/doctors')
        })}
      >
        {['fullName', 'specialization', 'licenseNumber'].map((key) => (
          <Field key={key} label={t(`doctors.${key}`)}>
            <Input {...f.register(key as any)} />
          </Field>
        ))}

        <Field label={t('doctors.department')}>
          <Select {...f.register('departmentId')}>
            <option value="">—</option>
            {(deps.data ?? []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('doctors.yearsExperience')}>
          <Input type="number" {...f.register('yearsExperience')} />
        </Field>

        <Field label={t('doctors.consultationFee')}>
          <Input type="number" {...f.register('consultationFee')} />
        </Field>

        <div className="md:col-span-2">
          <Field label={t('doctors.bio')}>
            <Textarea {...f.register('bio')} />
          </Field>
        </div>

        {m.error ? <Err e={m.error} /> : null}

        <div className="md:col-span-2">
          <Button disabled={m.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </FormPage>
  )
}

export function DoctorDetailsPage() {
  const { hospitalDoctorId } = useParams()
  const { t } = useTranslation()
  const doctors = useDoctors()

  const item = (doctors.data ?? []).find((doctorItem: any) => {
    return doctorItem.id === hospitalDoctorId
  })

  return (
    <div>
      <PageHeader
        title={t('doctors.detail')}
        actions={
          <>
            <BackButton />

            {item ? (
              <ActionLink
                to={`/doctors/${item.id}/availability`}
                label={t('doctors.manageAvailability')}
              />
            ) : null}
          </>
        }
      />

      {doctors.isLoading ? (
        <LoadingSkeleton />
      ) : doctors.error ? (
        <ErrorState />
      ) : !item ? (
        <EmptyState title={t('doctors.noDoctors')} />
      ) : (
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-3xl font-black dark:text-white">
              {item.doctor.fullName}
            </h2>

            <p className="text-slate-500">
              {item.doctor.specialization || '—'} ·{' '}
              {item.department?.name || '—'}
            </p>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <Info
                label={t('doctors.licenseNumber')}
                value={item.doctor.licenseNumber || '—'}
              />

              <Info
                label={t('doctors.yearsExperience')}
                value={String(item.doctor.yearsExperience ?? '—')}
              />

              <Info
                label={t('doctors.consultationFee')}
                value={String(item.doctor.consultationFee ?? '—')}
              />
            </dl>

            <p className="mt-6 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {item.doctor.bio || '—'}
            </p>
          </GlassCard>

          <DoctorAccountPanel
            hospitalDoctor={item}
            onCreated={() => {
              void doctors.refetch()
            }}
          />
        </div>
      )}
    </div>
  )
}

const dayValues = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

const typeValues = ['IN_PERSON', 'TELECONSULT', 'BOTH'] as const

const days: DayOfWeek[] = [...dayValues]
const types: AvailabilityAppointmentType[] = [...typeValues]

export function DoctorAvailabilityPage() {
  const { hospitalDoctorId = '' } = useParams()
  const { t } = useTranslation()
  const list = useDoctorAvailability(hospitalDoctorId)
  const create = useCreateDoctorAvailability(hospitalDoctorId)
  const update = useUpdateDoctorAvailability(hospitalDoctorId)
  const remove = useDeleteDoctorAvailability(hospitalDoctorId)
  const [editing, setEditing] = useState<DoctorAvailability | null>(null)

  const schema = z
    .object({
      dayOfWeek: z.enum(dayValues),
      startTime: z.string(),
      endTime: z.string(),
      slotDurationMinutes: z.coerce.number().min(5).max(240),
      appointmentType: z.enum(typeValues),
    })
    .refine((values) => timeOk(values.startTime, values.endTime), {
      path: ['endTime'],
      message: t('validation.timeRange'),
    })

  const f = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '13:00',
      slotDurationMinutes: 30,
      appointmentType: 'IN_PERSON',
    },
  })

  function edit(rule: DoctorAvailability) {
    setEditing(rule)
    f.reset({
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      slotDurationMinutes: rule.slotDurationMinutes,
      appointmentType: rule.appointmentType,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('availability.title')}
        subtitle={t('availability.subtitle')}
        actions={<BackButton />}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div>
          {list.isLoading ? (
            <LoadingSkeleton />
          ) : list.error ? (
            <ErrorState />
          ) : (list.data ?? []).length ? (
            <div className="space-y-3">
              {list.data?.map((rule) => (
                <GlassCard key={rule.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex gap-2">
                        <StatusBadge value={rule.dayOfWeek} />
                        <StatusBadge value={rule.appointmentType} />
                        <StatusBadge
                          value={rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </div>

                      <p className="mt-2 font-bold dark:text-white">
                        {rule.startTime} → {rule.endTime} ·{' '}
                        {rule.slotDurationMinutes} min
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => edit(rule)}>
                        {t('common.edit')}
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() =>
                          window.confirm(t('availability.deleteConfirm')) &&
                          remove.mutate(rule.id)
                        }
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <EmptyState title={t('availability.noRules')} />
          )}
        </div>

        <GlassCard>
          <h2 className="mb-4 font-black dark:text-white">
            {editing ? t('availability.edit') : t('availability.create')}
          </h2>

          <form
            className="space-y-4"
            onSubmit={f.handleSubmit(async (values) => {
              if (editing) {
                await update.mutateAsync({
                  availabilityId: editing.id,
                  payload: values,
                })
                setEditing(null)
              } else {
                await create.mutateAsync(values)
              }

              f.reset()
            })}
          >
            <Field label={t('availability.dayOfWeek')}>
              <Select {...f.register('dayOfWeek')}>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {t(`status.${day}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('availability.startTime')}>
                <Input type="time" {...f.register('startTime')} />
              </Field>

              <Field
                label={t('availability.endTime')}
                error={f.formState.errors.endTime?.message}
              >
                <Input type="time" {...f.register('endTime')} />
              </Field>
            </div>

            <Field label={t('availability.slotDurationMinutes')}>
              <Input type="number" {...f.register('slotDurationMinutes')} />
            </Field>

            <Field label={t('availability.appointmentType')}>
              <Select {...f.register('appointmentType')}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {t(`status.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>

            {create.error || update.error || remove.error ? (
              <Err e={create.error || update.error || remove.error} />
            ) : null}

            <div className="flex gap-2">
              <Button disabled={create.isPending || update.isPending}>
                {t('common.save')}
              </Button>

              {editing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
                  {t('common.cancel')}
                </Button>
              ) : null}
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

export function AppointmentsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const ap = useHospitalAppointments(status)

  const rows = useMemo(() => {
    return (ap.data ?? []).filter((appointment) =>
      `${appointment.patient?.fullName ?? ''} ${appointment.doctor?.fullName ?? ''
        } ${appointment.department?.name ?? ''} ${appointment.reason ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [ap.data, search])

  const statuses: Array<AppointmentStatus | ''> = [
    '',
    'REQUESTED',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]

  return (
    <div>
      <PageHeader
        title={t('appointments.title')}
        subtitle={t('appointments.subtitle')}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_260px]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
        />

        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AppointmentStatus | '')
          }
        >
          {statuses.map((appointmentStatus) => (
            <option key={appointmentStatus || 'all'} value={appointmentStatus}>
              {appointmentStatus
                ? t(`status.${appointmentStatus}`)
                : t('common.all')}
            </option>
          ))}
        </Select>
      </div>

      {ap.isLoading ? (
        <LoadingSkeleton />
      ) : ap.error ? (
        <ErrorState />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((appointment) => (
            <AppointmentRow key={appointment.id} a={appointment} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('appointments.noAppointments')} />
      )}
    </div>
  )
}

export function AppointmentDetailsPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()

  const ap = useHospitalAppointment(id)
  const confirm = useConfirmAppointment()
  const cancel = useCancelAppointment()
  const complete = useCompleteAppointment()
  const noShow = useNoShowAppointment()

  const a = ap.data
  const isTeleconsult = a?.appointmentType === 'TELECONSULT'

  const teleconsult = useHospitalTeleconsult(id, Boolean(isTeleconsult))
  const saveTeleconsult = useSaveHospitalTeleconsultLink(id)
  const startTeleconsult = useStartHospitalTeleconsult(id)
  const endTeleconsult = useEndHospitalTeleconsult(id)

  const session =
    teleconsult.data?.teleconsultSession || a?.teleconsultSession || null

  const [providerName, setProviderName] = useState('Yandex Telemost')
  const [joinUrl, setJoinUrl] = useState('https://telemost.yandex.ru/j/123456789')
  const [hostUrl, setHostUrl] = useState('https://telemost.yandex.ru/j/123456789')
  const [teleconsultError, setTeleconsultError] = useState('')
  const [teleconsultMessage, setTeleconsultMessage] = useState('')

  useEffect(() => {
    if (session) {
      setProviderName(session.providerName || '')
      setJoinUrl(session.joinUrl || '')
      setHostUrl(session.hostUrl || '')
    }
  }, [session?.id, session?.providerName, session?.joinUrl, session?.hostUrl])

  function openExternalUrl(url?: string | null) {
    if (!url) {
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function action(kind: string) {
    if (!a) return

    try {
      if (kind === 'confirm') {
        await confirm.mutateAsync(id)
      }

      if (kind === 'cancel') {
        await cancel.mutateAsync({
          id,
          cancellationReason:
            prompt(t('appointments.cancelReason')) || undefined,
        })
      }

      if (kind === 'complete') {
        await complete.mutateAsync(id)
      }

      if (kind === 'noShow') {
        await noShow.mutateAsync(id)
      }

      await ap.refetch()
    } catch {
      // Mutation errors are displayed below.
    }
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
      await ap.refetch()
      await teleconsult.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof Error
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
      await ap.refetch()
      await teleconsult.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof Error
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
      await ap.refetch()
      await teleconsult.refetch()
    } catch (error) {
      setTeleconsultError(
        error instanceof Error
          ? error.message
          : 'Failed to end teleconsult session.'
      )
    }
  }

  const canManageTeleconsult =
    isTeleconsult && a && ['REQUESTED', 'CONFIRMED'].includes(a.status)

  const isSessionEnded = session?.status === 'ENDED'

  return (
    <div>
      <PageHeader title={t('appointments.detail')} actions={<BackButton />} />

      {ap.isLoading ? (
        <LoadingSkeleton />
      ) : ap.error || !a ? (
        <ErrorState />
      ) : (
        <div className="space-y-5">
          <GlassCard>
            <div className="flex gap-2">
              <StatusBadge value={a.status} />
              <StatusBadge value={a.appointmentType} />
            </div>

            <h2 className="mt-2 text-2xl font-black dark:text-white">
              {a.patient?.fullName}
            </h2>

            <p className="text-sm text-slate-500">
              {a.patient?.user?.email || a.patient?.phone || '—'}
            </p>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label={t('appointments.doctor')} value={a.doctor?.fullName} />
              <Info
                label={t('appointments.department')}
                value={a.department?.name}
              />
              <Info label={t('appointments.reason')} value={a.reason} />
              <Info
                label={t('appointments.cancelReason')}
                value={a.cancellationReason}
              />

              <div>
                <dt className="text-sm text-slate-500">
                  {t('appointments.scheduledStart')}
                </dt>
                <dd className="mt-1 font-bold dark:text-white">
                  <TimeRange start={a.scheduledStart} end={a.scheduledEnd} />
                </dd>
              </div>

              {isTeleconsult ? (
                <>
                  <Info
                    label="Meeting provider"
                    value={session?.providerName || '—'}
                  />
                  <Info label="Meeting status" value={session?.status || '—'} />
                </>
              ) : null}
            </dl>
          </GlassCard>

          {isTeleconsult ? (
            <GlassCard>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <StatusBadge value="TELECONSULT" />

                  <h3 className="mt-3 text-2xl font-black dark:text-white">
                    {session?.providerName || 'Meeting link not set'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Status:{' '}
                    <span className="font-black">
                      {session?.status || 'PENDING'}
                    </span>
                  </p>

                  <p className="mt-2 break-all text-sm text-slate-500">
                    {session?.joinUrl || 'No meeting URL has been added yet.'}
                  </p>

                  {!canManageTeleconsult ? (
                    <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                      Meeting controls are available only for REQUESTED or
                      CONFIRMED teleconsult appointments.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {session?.joinUrl ? (
                    <Button
                      variant="secondary"
                      disabled={isSessionEnded}
                      onClick={() => openExternalUrl(session.joinUrl)}
                    >
                      {isSessionEnded ? 'Session ended' : 'Join'}
                    </Button>
                  ) : null}

                  <Button
                    disabled={
                      !session?.id ||
                      !canManageTeleconsult ||
                      startTeleconsult.isPending
                    }
                    onClick={() => void startMeeting()}
                  >
                    {startTeleconsult.isPending ? 'Starting...' : 'Start'}
                  </Button>

                  <Button
                    variant="danger"
                    disabled={
                      !session?.id ||
                      !canManageTeleconsult ||
                      endTeleconsult.isPending
                    }
                    onClick={() => void endMeeting()}
                  >
                    {endTeleconsult.isPending ? 'Ending...' : 'End'}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <Field label="Provider name">
                  <Input
                    value={providerName}
                    onChange={(event) => setProviderName(event.target.value)}
                    placeholder="Yandex Telemost"
                  />
                </Field>

                <Field label="Join URL">
                  <Input
                    value={joinUrl}
                    onChange={(event) => setJoinUrl(event.target.value)}
                    placeholder="https://telemost.yandex.ru/j/123456789"
                  />
                </Field>

                <Field label="Host URL optional">
                  <Input
                    value={hostUrl}
                    onChange={(event) => setHostUrl(event.target.value)}
                    placeholder="https://telemost.yandex.ru/j/123456789"
                  />
                </Field>
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

              <div className="mt-5">
                <Button
                  disabled={!canManageTeleconsult || saveTeleconsult.isPending}
                  onClick={() => void saveMeetingLink()}
                >
                  {saveTeleconsult.isPending ? 'Saving...' : 'Save Meeting Link'}
                </Button>
              </div>
            </GlassCard>
          ) : null}

          {confirm.error || cancel.error || complete.error || noShow.error ? (
            <Err
              e={
                confirm.error ||
                cancel.error ||
                complete.error ||
                noShow.error
              }
            />
          ) : null}

          <GlassCard>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={a.status !== 'REQUESTED'}
                onClick={() => void action('confirm')}
              >
                {t('appointments.confirm')}
              </Button>

              <Button
                variant="danger"
                disabled={['CANCELLED', 'COMPLETED'].includes(a.status)}
                onClick={() => void action('cancel')}
              >
                {t('common.cancel')}
              </Button>

              <Button
                variant="success"
                disabled={['CANCELLED', 'NO_SHOW'].includes(a.status)}
                onClick={() => void action('complete')}
              >
                {t('appointments.complete')}
              </Button>

              <Button
                variant="warning"
                disabled={['CANCELLED', 'COMPLETED'].includes(a.status)}
                onClick={() => void action('noShow')}
              >
                {t('appointments.noShow')}
              </Button>

              {a.status === 'CONFIRMED' && !a.encounter ? (
                <ActionLink
                  to={`/appointments/${a.id}/encounter`}
                  label={t('appointments.createEncounter')}
                />
              ) : null}

              {a.encounter ? (
                <ActionLink
                  to={`/encounters/${a.encounter.id}`}
                  label={t('appointments.viewEncounter')}
                />
              ) : null}

              <ActionLink
                to={`/patients/${a.patientId}/records`}
                label={t('appointments.viewPatientRecords')}
              />

              {a.appointmentType === 'TELECONSULT' ? (
                <Button
                  variant="secondary"
                  disabled={!session?.joinUrl || isSessionEnded}
                  onClick={() => openExternalUrl(session?.joinUrl)}
                >
                  {isSessionEnded ? 'Session ended' : 'Join Consultation'}
                </Button>
              ) : null}
            </div>
          </GlassCard>

          <MedicalDocumentsPanel
            patientId={a.patientId}
            appointmentId={a.id}
            encounterId={a.encounter?.id}
          />
        </div>
      )}
    </div>
  )
}

const encounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  followUpInstructions: z.string().optional(),
})

export function CreateEncounterPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const nav = useNavigate()
  const ap = useHospitalAppointment(id)
  const create = useCreateEncounter(id)

  const f = useForm<z.infer<typeof encounterSchema>>({
    resolver: zodResolver(encounterSchema),
  })

  const a = ap.data

  return (
    <div>
      <PageHeader title={t('encounters.createTitle')} actions={<BackButton />} />

      {ap.isLoading ? (
        <LoadingSkeleton />
      ) : ap.error || !a ? (
        <ErrorState />
      ) : a.status !== 'CONFIRMED' ? (
        <ErrorState message={t('encounters.notAllowed')} />
      ) : (
        <div className="space-y-5">
          <GlassCard>
            <StatusBadge value={a.status} />
            <h2 className="mt-2 text-xl font-black dark:text-white">
              {a.patient?.fullName}
            </h2>
            <p className="text-sm text-slate-500">
              {a.doctor?.fullName} · {a.department?.name}
            </p>
          </GlassCard>

          <EncounterForm
            form={f}
            mutation={create}
            onSubmit={async (values) => {
              const encounter = await create.mutateAsync(values)
              nav(`/encounters/${encounter.id}`)
            }}
          />
        </div>
      )}
    </div>
  )
}

function EncounterForm({
  form,
  mutation,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof encounterSchema>>>
  mutation: any
  onSubmit: (values: z.infer<typeof encounterSchema>) => Promise<void>
}) {
  const { t } = useTranslation()

  return (
    <GlassCard>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {[
          'chiefComplaint',
          'notes',
          'diagnosis',
          'prescription',
          'followUpInstructions',
        ].map((key) => (
          <Field key={key} label={t(`encounters.${key}`)}>
            <Textarea {...form.register(key as any)} />
          </Field>
        ))}

        {mutation.error ? <Err e={mutation.error} /> : null}

        <Button disabled={mutation.isPending}>{t('common.save')}</Button>
      </form>
    </GlassCard>
  )
}

export function EncounterDetailsPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const en = useEncounter(id)
  const e = en.data

  return (
    <div>
      <PageHeader
        title={t('encounters.detailTitle')}
        actions={
          <>
            <BackButton />
            {e ? (
              <ActionLink to={`/encounters/${e.id}/edit`} label={t('common.edit')} />
            ) : null}
          </>
        }
      />

      {en.isLoading ? (
        <LoadingSkeleton />
      ) : en.error || !e ? (
        <ErrorState />
      ) : (
        <div className="space-y-5">
          <GlassCard>
            <h2 className="text-2xl font-black dark:text-white">
              {e.diagnosis || t('encounters.title')}
            </h2>

            <p className="text-sm text-slate-500">
              {e.patient?.fullName || '—'} · {e.doctor?.fullName || '—'} ·{' '}
              <DateTime value={e.createdAt} />
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink
                to={`/appointments/${e.appointmentId}`}
                label={t('appointments.detail')}
              />
              <ActionLink
                to={`/patients/${e.patientId}/records`}
                label={t('appointments.viewPatientRecords')}
              />
            </div>
          </GlassCard>

          <GlassCard>
            {[
              'chiefComplaint',
              'notes',
              'diagnosis',
              'prescription',
              'followUpInstructions',
            ].map((key) => (
              <div
                key={key}
                className="border-b border-slate-200/60 py-4 last:border-0 dark:border-white/10"
              >
                <p className="text-sm font-bold text-slate-500">
                  {t(`encounters.${key}`)}
                </p>
                <p className="mt-1 whitespace-pre-wrap dark:text-white">
                  {(e as any)[key] || '—'}
                </p>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export function EditEncounterPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const nav = useNavigate()
  const en = useEncounter(id)
  const update = useUpdateEncounter(id)

  const f = useForm<z.infer<typeof encounterSchema>>({
    resolver: zodResolver(encounterSchema),
    values: {
      chiefComplaint: en.data?.chiefComplaint ?? '',
      notes: en.data?.notes ?? '',
      diagnosis: en.data?.diagnosis ?? '',
      prescription: en.data?.prescription ?? '',
      followUpInstructions: en.data?.followUpInstructions ?? '',
    },
  })

  return (
    <div>
      <PageHeader title={t('encounters.editTitle')} actions={<BackButton />} />

      {en.isLoading ? (
        <LoadingSkeleton />
      ) : en.error ? (
        <ErrorState />
      ) : (
        <EncounterForm
          form={f}
          mutation={update}
          onSubmit={async (values) => {
            await update.mutateAsync(values)
            nav(`/encounters/${id}`)
          }}
        />
      )}
    </div>
  )
}

export function PatientRecordsPage() {
  const { patientId = '' } = useParams()
  const { t } = useTranslation()
  const records = usePatientRecords(patientId)

  return (
    <div>
      <PageHeader
        title={t('records.title')}
        subtitle={t('records.subtitle')}
        actions={<BackButton />}
      />

      {records.isLoading ? (
        <LoadingSkeleton />
      ) : records.error ? (
        <ErrorState />
      ) : (records.data ?? []).length ? (
        <div className="space-y-3">
          {records.data?.map((encounter) => (
            <GlassCard key={encounter.id}>
              <h3 className="font-black dark:text-white">
                {encounter.diagnosis || t('records.title')}
              </h3>

              <p className="text-sm text-slate-500">
                <DateTime value={encounter.createdAt} /> ·{' '}
                {encounter.doctor?.fullName || '—'} ·{' '}
                {encounter.department?.name || '—'}
              </p>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {encounter.chiefComplaint || '—'}
              </p>

              <div className="mt-4">
                <ActionLink
                  to={`/encounters/${encounter.id}`}
                  label={t('common.view')}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title={t('records.noRecords')} />
      )}
    </div>
  )
}

export function TeleconsultPage() {
  const { appointmentId = '' } = useParams()
  const { t } = useTranslation()
  const ap = useHospitalAppointment(appointmentId)
  const a = ap.data
  const session = a?.teleconsultSession

  function openExternalUrl(url?: string | null) {
    if (!url) {
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <PageHeader
        title={t('teleconsult.title')}
        subtitle={t('teleconsult.subtitle')}
        actions={<BackButton />}
      />

      {ap.isLoading ? (
        <LoadingSkeleton />
      ) : ap.error || !a ? (
        <ErrorState />
      ) : (
        <div className="space-y-5">
          <GlassCard>
            <div className="flex gap-2">
              <StatusBadge value={a.status} />
              <StatusBadge value={a.appointmentType} />
              {session ? <StatusBadge value={session.status} /> : null}
            </div>

            <h2 className="mt-2 text-xl font-black dark:text-white">
              {a.patient?.fullName} ↔ {a.doctor?.fullName}
            </h2>

            <p className="text-sm text-slate-500">
              Provider: {session?.providerName || 'Meeting link not set'}
            </p>

            <p className="mt-2 break-all text-sm text-slate-500">
              {session?.joinUrl || 'No meeting URL has been added yet.'}
            </p>

            {session?.joinUrl ? (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  disabled={session.status === 'ENDED'}
                  onClick={() => openExternalUrl(session.joinUrl)}
                >
                  {session.status === 'ENDED' ? 'Session ended' : 'Join Meeting'}
                </Button>
              </div>
            ) : null}
          </GlassCard>

          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <GlassCard className="flex min-h-[420px] items-center justify-center text-center text-slate-500">
              {session?.joinUrl
                ? 'External meeting link is ready. Use Join Meeting to open it.'
                : t('teleconsult.videoPlaceholder')}
            </GlassCard>

            <GlassCard className="min-h-[420px] text-slate-500">
              {t('teleconsult.chatPlaceholder')}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const health = useHealth()
  const clear = useAuthStore((store) => store.clearSession)
  const hospital = useAuthStore((store) => store.hospital)
  const [msg, setMsg] = useState('')

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 font-black dark:text-white">
            {t('settings.theme')}
          </h2>
          <ThemeToggle />
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-black dark:text-white">
            {t('settings.language')}
          </h2>
          <LanguageSwitcher />
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-black dark:text-white">
            {t('settings.apiStatus')}
          </h2>
          <StatusBadge
            value={health.data?.status === 'ok' ? 'ACTIVE' : 'INACTIVE'}
          />
          <p className="mt-2 text-sm text-slate-500">
            {health.data?.service || '—'}
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-black dark:text-white">
            {t('settings.hospitalLogo')}
          </h2>

          <div className="flex items-center gap-4">
            <HospitalLogo
              name={hospital?.name}
              logoUrl={hospital?.logoUrl}
              size="lg"
            />

            <div>
              <p className="mb-3 text-sm text-slate-500">{hospital?.name}</p>

              <ActionLink to="/profile" label="Manage Logo" />
            </div>
          </div>

          {msg ? <p className="mt-2 text-sm text-amber-700">{msg}</p> : null}
        </GlassCard>

        <GlassCard className="xl:col-span-2">
          <p className="text-sm text-slate-500">
            {t('settings.securityFuture')}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t('settings.notificationsFuture')}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t('settings.profileFuture')}
          </p>

          <Button className="mt-5" variant="danger" onClick={clear}>
            {t('nav.logout')}
          </Button>
        </GlassCard>
      </div>
    </div>
  )
}

export function AccountPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((store) => store.user)
  const staff = useAuthStore((store) => store.staff)
  const hospital = useAuthStore((store) => store.hospital)
  const clear = useAuthStore((store) => store.clearSession)

  return (
    <div>
      <PageHeader title={t('nav.account')} subtitle={t('auth.session')} />

      <GlassCard>
        <dl className="grid gap-4 md:grid-cols-2">
          <Info label={t('auth.email')} value={user?.email} />

          <div>
            <dt className="text-sm text-slate-500">{t('common.status')}</dt>
            <dd className="mt-1">
              <StatusBadge value={user?.status} />
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="mt-1">
              <StatusBadge value={user?.primaryRole} />
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Staff role</dt>
            <dd className="mt-1">
              <StatusBadge value={staff?.staffRole} />
            </dd>
          </div>

          <Info label="Hospital" value={hospital?.name} />
          <Info label="Hospital Logo URL" value={hospital?.logoUrl} />

          <Info
            label="Last login"
            value={new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(user?.lastLoginAt ? new Date(user.lastLoginAt) : new Date())}
          />
        </dl>

        <Button className="mt-6" variant="danger" onClick={clear}>
          {t('nav.logout')}
        </Button>
      </GlassCard>
    </div>
  )
}

type ReviewStatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED'

function RatingLine({
  label,
  value,
}: {
  label: string
  value?: number | null
}) {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      <span className="font-bold">{label}:</span>{' '}
      {typeof value === 'number' ? `${value}/5` : '—'}
    </p>
  )
}

function ReviewCard({
  review,
  type,
}: {
  review: any
  type: 'hospital' | 'doctor'
}) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={review.status} />
            <StatusBadge value={type === 'hospital' ? 'HOSPITAL' : 'DOCTOR'} />
          </div>

          <h3 className="mt-3 font-black dark:text-white">
            {type === 'hospital'
              ? review.hospital?.name || 'Hospital review'
              : review.doctor?.fullName || 'Doctor review'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Patient: {review.patient?.fullName || '—'}
          </p>

          <p className="text-sm text-slate-500">
            Appointment: {review.appointmentId}
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-3xl font-black dark:text-white">
            {review.overallRating}/5
          </p>
          <p className="text-xs text-slate-500">Overall</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {type === 'hospital' ? (
          <>
            <RatingLine label="Staff" value={review.staffRating} />
            <RatingLine label="Cleanliness" value={review.cleanlinessRating} />
            <RatingLine label="Waiting time" value={review.waitingTimeRating} />
            <RatingLine label="Service" value={review.serviceRating} />
          </>
        ) : (
          <>
            <RatingLine
              label="Communication"
              value={review.communicationRating}
            />
            <RatingLine
              label="Professionalism"
              value={review.professionalismRating}
            />
            <RatingLine label="Helpfulness" value={review.helpfulnessRating} />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold">Would recommend:</span>{' '}
              {review.wouldRecommend === true
                ? 'Yes'
                : review.wouldRecommend === false
                  ? 'No'
                  : '—'}
            </p>
          </>
        )}
      </div>

      {review.comment ? (
        <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {review.comment}
        </div>
      ) : null}

      {review.moderationNote ? (
        <div className="mt-3 rounded-2xl bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-200">
          <span className="font-bold">Moderation note:</span>{' '}
          {review.moderationNote}
        </div>
      ) : null}
    </GlassCard>
  )
}

function FeedbackCard({ feedback }: { feedback: any }) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value="INTERNAL" />
            {feedback.wasNoShow ? <StatusBadge value="NO_SHOW" /> : null}
          </div>

          <h3 className="mt-3 font-black dark:text-white">
            {feedback.patient?.fullName || 'Patient feedback'}
          </h3>

          <p className="text-sm text-slate-500">
            Doctor: {feedback.doctor?.fullName || '—'}
          </p>

          <p className="text-sm text-slate-500">
            Created by: {feedback.createdByUser?.email || '—'}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          {feedback.createdAt
            ? new Date(feedback.createdAt).toLocaleString()
            : '—'}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Arrived on time:</span>{' '}
          {feedback.arrivedOnTime === true
            ? 'Yes'
            : feedback.arrivedOnTime === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">No-show:</span>{' '}
          {feedback.wasNoShow === true
            ? 'Yes'
            : feedback.wasNoShow === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Followed instructions:</span>{' '}
          {feedback.followedInstructions === true
            ? 'Yes'
            : feedback.followedInstructions === false
              ? 'No'
              : '—'}
        </p>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold">Follow-up needed:</span>{' '}
          {feedback.followUpNeeded === true
            ? 'Yes'
            : feedback.followUpNeeded === false
              ? 'No'
              : '—'}
        </p>
      </div>

      {feedback.communicationNote ? (
        <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="font-bold">Communication note:</span>{' '}
          {feedback.communicationNote}
        </div>
      ) : null}

      {feedback.internalNote ? (
        <div className="mt-3 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-bold">Internal note:</span>{' '}
          {feedback.internalNote}
        </div>
      ) : null}
    </GlassCard>
  )
}

export function ReviewsPage() {
  const [status, setStatus] = useState<ReviewStatusFilter>('')

  const summary = useHospitalReviewSummary()
  const hospitalReviews = useHospitalReviews(status)
  const doctorReviews = useDoctorReviews(status)

  if (
    summary.isLoading ||
    hospitalReviews.isLoading ||
    doctorReviews.isLoading
  ) {
    return <LoadingSkeleton />
  }

  if (summary.error || hospitalReviews.error || doctorReviews.error) {
    return <ErrorState />
  }

  const hospitalRows = hospitalReviews.data ?? []
  const doctorRows = doctorReviews.data ?? []

  const feedbackRows = [
    ...hospitalRows.map((review) => review.appointment?.patientVisitFeedback),
    ...doctorRows.map((review) => review.appointment?.patientVisitFeedback),
  ].filter(Boolean)

  return (
    <div>
      <PageHeader
        title="Reviews & Feedback"
        subtitle="Patient reviews, doctor reviews, and internal visit feedback."
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <p className="text-sm text-slate-500">Hospital reviews</p>
            <p className="mt-2 text-3xl font-black dark:text-white">
              {summary.data?.hospitalReviews.approved ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pending: {summary.data?.hospitalReviews.pending ?? 0} · Rejected:{' '}
              {summary.data?.hospitalReviews.rejected ?? 0}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm text-slate-500">Doctor reviews</p>
            <p className="mt-2 text-3xl font-black dark:text-white">
              {summary.data?.doctorReviews.approved ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pending: {summary.data?.doctorReviews.pending ?? 0} · Rejected:{' '}
              {summary.data?.doctorReviews.rejected ?? 0}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm text-slate-500">Internal patient feedback</p>
            <p className="mt-2 text-3xl font-black dark:text-white">
              {summary.data?.patientVisitFeedback.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Not public. Hospital-scoped only.
            </p>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-black dark:text-white">Filter reviews</h3>
              <p className="text-sm text-slate-500">
                Approved reviews are public-facing after moderation.
              </p>
            </div>

            <select
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ReviewStatusFilter)
              }
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </GlassCard>

        <section>
          <h2 className="mb-3 text-lg font-black dark:text-white">
            Hospital Reviews
          </h2>

          {hospitalRows.length ? (
            <div className="space-y-4">
              {hospitalRows.map((review) => (
                <ReviewCard key={review.id} review={review} type="hospital" />
              ))}
            </div>
          ) : (
            <EmptyState title="No hospital reviews found." />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-black dark:text-white">
            Doctor Reviews
          </h2>

          {doctorRows.length ? (
            <div className="space-y-4">
              {doctorRows.map((review) => (
                <ReviewCard key={review.id} review={review} type="doctor" />
              ))}
            </div>
          ) : (
            <EmptyState title="No doctor reviews found." />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-black dark:text-white">
            Internal Patient Feedback
          </h2>

          {feedbackRows.length ? (
            <div className="space-y-4">
              {feedbackRows.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          ) : (
            <GlassCard>
              <p className="text-sm text-slate-500">
                Internal patient feedback exists in the backend, but this page
                currently shows feedback only when it is included with related
                review/appointment data. Full patient-feedback list UI can be
                added next.
              </p>
            </GlassCard>
          )}
        </section>
      </div>
    </div>
  )
}