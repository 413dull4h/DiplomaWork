import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  HTMLAttributes,
} from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'
import { initials, dt, addr } from '../utils/format'
import type {
  Appointment,
  DoctorSlot,
  Encounter,
  Hospital,
  HospitalDoctor,
} from '../types/models'
import { usePatientAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import {
  supportedLanguages,
  type SupportedLanguage,
} from '../i18n'
import { NotificationBell } from './notifications/NotificationBell'
import { useChatUnreadCount } from '../hooks/useChats'

export function Button({
  className,
  variant = 'primary',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  const v = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-600/20',
    secondary:
      'bg-white/70 text-slate-900 ring-1 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20',
    ghost: 'hover:bg-slate-900/5 dark:hover:bg-white/10',
  }[variant]

  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
        v,
        className
      )}
      {...p}
    />
  )
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...p}
    className={cn(
      'min-h-11 w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-sky-300/50 dark:border-white/10 dark:bg-white/10 dark:text-white',
      p.className
    )}
  />
)

export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...p}
    className={cn(
      'min-h-11 w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-sky-300/50 dark:border-white/10 dark:bg-slate-900/80 dark:text-white',
      p.className
    )}
  />
)

export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    className={cn(
      'min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-sky-300/50 dark:border-white/10 dark:bg-white/10 dark:text-white',
      p.className
    )}
  />
)

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/60 bg-white/70 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/[.07]',
        className
      )}
      {...p}
    />
  )
}

export function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {children}
    </>
  )
}

export const Loading = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="h-24 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10"
      />
    ))}
  </div>
)

export function Empty({ text }: { text: string }) {
  return (
    <Card className="py-12 text-center">
      <p className="font-semibold text-slate-950 dark:text-white">{text}</p>
    </Card>
  )
}

export function ErrorBox({
  text = 'Could not load this page.',
}: {
  text?: string
}) {
  return (
    <Card className="border-rose-200 bg-rose-50/70 py-8 text-center dark:border-rose-400/20 dark:bg-rose-400/10">
      <p className="font-semibold text-rose-700 dark:text-rose-300">{text}</p>
    </Card>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>

      {children}

      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  )
}

const tone: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  CONFIRMED: 'bg-sky-100 text-sky-700 ring-sky-200',
  COMPLETED: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  REQUESTED: 'bg-amber-100 text-amber-800 ring-amber-200',
  PENDING: 'bg-amber-100 text-amber-800 ring-amber-200',
  CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-200',
  SUSPENDED: 'bg-rose-100 text-rose-700 ring-rose-200',
  REJECTED: 'bg-rose-100 text-rose-700 ring-rose-200',
  NO_SHOW: 'bg-slate-200 text-slate-700 ring-slate-300',
  IN_PERSON: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
  TELECONSULT: 'bg-violet-100 text-violet-700 ring-violet-200',
  BOTH: 'bg-blue-100 text-blue-700 ring-blue-200',
  LAB_REPORT: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
  PRESCRIPTION: 'bg-violet-100 text-violet-700 ring-violet-200',
  IMAGING: 'bg-blue-100 text-blue-700 ring-blue-200',
  DISCHARGE_SUMMARY: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  REFERRAL: 'bg-amber-100 text-amber-800 ring-amber-200',
  GENERAL_REPORT: 'bg-slate-100 text-slate-700 ring-slate-200',
  OTHER: 'bg-slate-100 text-slate-700 ring-slate-200',
  PATIENT: 'bg-sky-100 text-sky-700 ring-sky-200',
  DOCTOR: 'bg-violet-100 text-violet-700 ring-violet-200',
  HOSPITAL_STAFF: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  READ: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  SENT: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function Badge({ value }: { value?: string | null }) {
  const { t } = useTranslation()

  return value ? (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10',
        tone[value] || 'bg-slate-100 text-slate-700 ring-slate-200'
      )}
    >
      {t(`status.${value}`, { defaultValue: value })}
    </span>
  ) : null
}

export function Avatar({
  name,
  size = 'lg',
}: {
  name?: string | null
  size?: 'md' | 'lg' | 'xl'
}) {
  const s =
    size === 'xl'
      ? 'h-24 w-24 text-2xl'
      : size === 'lg'
        ? 'h-16 w-16 text-xl'
        : 'h-11 w-11 text-sm'

  return (
    <div
      className={`${s} grid shrink-0 place-items-center rounded-full border border-white/60 bg-gradient-to-br from-sky-500 to-emerald-400 font-bold text-white shadow-lg`}
    >
      {initials(name)}
    </div>
  )
}

export function Lang() {
  const { i18n, t } = useTranslation()
  const v = supportedLanguages.includes(i18n.language as SupportedLanguage)
    ? i18n.language
    : 'en'

  return (
    <Select
      aria-label="language"
      value={v}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      className="w-32"
    >
      {supportedLanguages.map((l) => (
        <option key={l} value={l}>
          {t(`languages.${l}`)}
        </option>
      ))}
    </Select>
  )
}

export function Theme() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Button variant="secondary" onClick={toggleTheme} aria-label="theme">
      {theme === 'dark' ? '☾' : '☀'}
    </Button>
  )
}

export function Confirm({
  open,
  title,
  children,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  children?: ReactNode
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return

    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', f)

    return () => removeEventListener('keydown', f)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          {title}
        </h2>

        <div className="mt-3">{children}</div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>

          <Button variant="danger" onClick={onConfirm}>
            {t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RatingPill({
  averageRating,
  reviewCount,
  wouldRecommendCount,
}: {
  averageRating?: number | null
  reviewCount?: number | null
  wouldRecommendCount?: number | null
}) {
  const hasRating =
    typeof averageRating === 'number' && Boolean(reviewCount && reviewCount > 0)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
        ⭐ {hasRating ? `${averageRating.toFixed(1)} / 5` : 'No rating yet'}
      </span>

      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
        {reviewCount && reviewCount > 0
          ? `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
          : '0 reviews'}
      </span>

      {typeof wouldRecommendCount === 'number' && wouldRecommendCount > 0 ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20">
          {wouldRecommendCount} recommend
        </span>
      ) : null}
    </div>
  )
}

export function HospitalCard({ h }: { h: Hospital }) {
  const { t } = useTranslation()
  const hospitalWithRating = h as Hospital & {
    averageRating?: number | null
    reviewCount?: number | null
    rating?: {
      averageRating?: number | null
      reviewCount?: number | null
    }
  }

  const averageRating =
    hospitalWithRating.averageRating ?? hospitalWithRating.rating?.averageRating ?? null

  const reviewCount =
    hospitalWithRating.reviewCount ?? hospitalWithRating.rating?.reviewCount ?? 0

  return (
    <Card className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="flex justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {h.name}
            </h3>

            <p className="text-sm text-slate-500">{h.legalName}</p>
          </div>

          <Badge value={h.status} />
        </div>

        <RatingPill averageRating={averageRating} reviewCount={reviewCount} />

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {addr(h.address)}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {h.contactEmail || '—'} · {h.contactPhone || '—'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(h.departments || []).slice(0, 5).map((d) => (
            <span
              key={d.id}
              className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700"
            >
              {d.name}
            </span>
          ))}
        </div>
      </div>

      <Link to={`/app/hospitals/${h.id}/doctors`}>
        <Button className="w-full">{t('hospital.viewDoctors')}</Button>
      </Link>
    </Card>
  )
}

export function DoctorCard({ d }: { d: HospitalDoctor }) {
  const { t } = useTranslation()

  const hospitalDoctorWithRating = d as HospitalDoctor & {
    averageRating?: number | null
    reviewCount?: number | null
    wouldRecommendCount?: number | null
    rating?: {
      averageRating?: number | null
      reviewCount?: number | null
      wouldRecommendCount?: number | null
    }
  }

  const doctorWithRating = d.doctor as HospitalDoctor['doctor'] & {
    averageRating?: number | null
    reviewCount?: number | null
    wouldRecommendCount?: number | null
    rating?: {
      averageRating?: number | null
      reviewCount?: number | null
      wouldRecommendCount?: number | null
    }
  }

  const averageRating =
    hospitalDoctorWithRating.averageRating ??
    hospitalDoctorWithRating.rating?.averageRating ??
    doctorWithRating.averageRating ??
    doctorWithRating.rating?.averageRating ??
    null

  const reviewCount =
    hospitalDoctorWithRating.reviewCount ??
    hospitalDoctorWithRating.rating?.reviewCount ??
    doctorWithRating.reviewCount ??
    doctorWithRating.rating?.reviewCount ??
    0

  const wouldRecommendCount =
    hospitalDoctorWithRating.wouldRecommendCount ??
    hospitalDoctorWithRating.rating?.wouldRecommendCount ??
    doctorWithRating.wouldRecommendCount ??
    doctorWithRating.rating?.wouldRecommendCount ??
    0

  return (
    <Card className="flex h-full flex-col justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">
          {d.doctor.fullName}
        </h3>

        <p className="text-sm font-medium text-sky-700">
          {d.doctor.specialization || '—'}
        </p>

        <RatingPill
          averageRating={averageRating}
          reviewCount={reviewCount}
          wouldRecommendCount={wouldRecommendCount}
        />

        <p className="mt-3 text-sm text-slate-500">
          {d.department?.name || '—'} · {t('hospital.fee')}:{' '}
          {d.doctor.consultationFee ?? '—'}
        </p>

        <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
          {d.doctor.bio || ''}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link to={`/app/doctors/${d.id}/slots`}>
          <Button variant="secondary" className="w-full">
            {t('hospital.viewSlots')}
          </Button>
        </Link>

        <Link to={`/app/book/${d.id}`}>
          <Button className="w-full">{t('hospital.book')}</Button>
        </Link>
      </div>
    </Card>
  )
}

export function Slots({
  slots,
  selected,
  onSelect,
}: {
  slots: DoctorSlot[]
  selected?: DoctorSlot | null
  onSelect: (s: DoctorSlot) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {slots.map((s) => (
        <button
          type="button"
          key={s.startTime + s.endTime}
          onClick={() => onSelect(s)}
          className={cn(
            'min-h-12 rounded-2xl border px-4 py-3 text-sm font-bold',
            selected?.startTime === s.startTime
              ? 'border-sky-500 bg-sky-600 text-white'
              : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/10'
          )}
        >
          {s.startTime} - {s.endTime}
        </button>
      ))}
    </div>
  )
}

export function AppointmentCard({ a }: { a: Appointment }) {
  const { t, i18n } = useTranslation()

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950 dark:text-white">
            {a.hospital?.name || '—'}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {a.doctor?.fullName || '—'} · {a.department?.name || '—'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge value={a.status} />
          <Badge value={a.appointmentType} />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {dt(a.scheduledStart, i18n.language)} →{' '}
        {dt(a.scheduledEnd, i18n.language)}
      </p>

      <Link to={`/app/appointments/${a.id}`}>
        <Button variant="secondary">{t('details')}</Button>
      </Link>
    </Card>
  )
}

export function RecordCard({ r }: { r: Encounter }) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <h3 className="font-bold text-slate-950 dark:text-white">
        {r.diagnosis || t('records.detail')}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {r.hospital?.name || '—'} · {r.doctor?.fullName || '—'} ·{' '}
        {dt(r.createdAt, i18n.language)}
      </p>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
        {r.prescription || r.chiefComplaint || '—'}
      </p>

      <Link to={`/app/records/${r.id}`}>
        <Button className="mt-4" variant="secondary">
          {t('details')}
        </Button>
      </Link>
    </Card>
  )
}

function NavLabelWithUnread({
  label,
  showUnread,
  unreadCount,
}: {
  label: string
  showUnread: boolean
  unreadCount: number
}) {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{label}</span>

      {showUnread && unreadCount > 0 ? (
        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">
          {unreadCount}
        </span>
      ) : null}
    </span>
  )
}

export function AppNav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { patient, clearSession } = usePatientAuthStore()
  const unreadChats = useChatUnreadCount()
  const unreadChatCount = unreadChats.data || 0

  const links = [
    ['/app/dashboard', 'dashboard'],
    ['/app/profile', 'profile'],
    ['/app/medical-basics', 'medicalBasics'],
    ['/app/hospitals', 'hospitals'],
    ['/app/appointments', 'appointments'],
    ['/app/chats', 'chats'],
    ['/app/records', 'records'],
    ['/app/documents', 'documents'],
    ['/app/settings', 'settings'],
    ['/app/account', 'account'],
  ] as const

  const navFallback: Record<(typeof links)[number][1], string> = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    medicalBasics: 'Medical Basics',
    hospitals: 'Find Hospitals',
    appointments: 'Appointments',
    chats: 'Chats',
    records: 'Medical Records',
    documents: 'Documents',
    settings: 'Settings',
    account: 'Account',
  }

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <>
      <aside className="hidden h-screen w-72 shrink-0 border-r border-white/50 bg-white/50 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/40 lg:block">
        <div className="mb-8 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-xs uppercase tracking-[.3em] text-sky-300">
            careOS
          </p>
          <h1 className="mt-2 text-xl font-bold">Patient</h1>
        </div>

        <nav className="space-y-2">
          {links.map(([to, k]) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10"
            >
              <NavLabelWithUnread
                label={t(`nav.${k}`, { defaultValue: navFallback[k] })}
                showUnread={k === 'chats'}
                unreadCount={unreadChatCount}
              />
            </Link>
          ))}
        </nav>
      </aside>

      <div className="sticky top-0 z-40 border-b border-white/40 bg-white/70 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            ☰
          </Button>

          <p className="min-w-0 flex-1 truncate text-sm font-bold dark:text-white">
            careOS / {patient?.fullName || 'Patient'}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <Theme />
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 z-[110] flex w-[min(88vw,360px)] flex-col overflow-hidden rounded-r-[2rem] border-r border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[.25em] text-sky-500">
                  careOS
                </p>
                <b className="text-slate-950 dark:text-white">
                  Patient
                </b>
              </div>

              <Button variant="ghost" onClick={() => setOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="mb-5 grid grid-cols-[1fr_auto] gap-2">
              <Lang />
              <Theme />
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
              {links.map(([to, k]) => (
                <Link
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  key={to}
                  to={to}
                >
                  <NavLabelWithUnread
                    label={t(`nav.${k}`, { defaultValue: navFallback[k] })}
                    showUnread={k === 'chats'}
                    unreadCount={unreadChatCount}
                  />
                </Link>
              ))}
            </nav>

            <Button variant="danger" className="mt-5 w-full" onClick={logout}>
              {t('logout')}
            </Button>
          </aside>
        </div>
      ) : null}
    </>
  )
}

export function Top() {
  const { patient, clearSession } = usePatientAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <header className="hidden items-center justify-between border-b border-white/50 bg-white/40 px-8 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/20 lg:flex">
      <div>
        <p className="text-sm text-slate-500">careOS Patient</p>
        <b className="dark:text-white">{patient?.fullName || 'Patient'}</b>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <Lang />
        <Theme />
        <Avatar name={patient?.fullName} size="md" />

        <Button
          variant="secondary"
          onClick={() => {
            clearSession()
            navigate('/login')
          }}
        >
          {t('logout')}
        </Button>
      </div>
    </header>
  )
}

export function PublicNav() {
  const { t } = useTranslation()

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
      <Link to="/" className="text-xl font-black">
        careOS
      </Link>

      <nav className="hidden gap-5 text-sm font-semibold sm:flex">
        <Link to="/features">{t('nav.features')}</Link>
        <Link to="/trust">{t('nav.trust')}</Link>
      </nav>

      <div className="flex gap-2">
        <Lang />
        <Theme />

        <Link to="/login">
          <Button variant="secondary">{t('nav.login')}</Button>
        </Link>
      </div>
    </header>
  )
}
