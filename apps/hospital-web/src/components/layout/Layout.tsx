import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Star,
  Stethoscope,
  UserCircle,
  UsersRound,
  X,
} from 'lucide-react'
import { NotificationBell } from '../notifications/NotificationBell'
import { languages } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { HospitalLogo } from '../ui/HospitalLogo'
import { useHospitalChatUnreadCount } from '../../hooks/useHospitalChats'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select
      aria-label="Language"
      value={i18n.language}
      onChange={(event) => void i18n.changeLanguage(event.target.value)}
      className="w-full sm:w-36"
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </Select>
  )
}

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <Button
      variant="secondary"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="shrink-0"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
}

const groups = [
  {
    title: 'nav.overview',
    items: [
      ['/dashboard', 'nav.dashboard', LayoutDashboard],
      ['/profile', 'nav.profile', Building2],
      ['/locations', 'nav.locations', Building2],
    ],
  },
  {
    title: 'nav.operations',
    items: [
      ['/departments', 'nav.departments', ClipboardList],
      ['/doctors', 'nav.doctors', Stethoscope],
      ['/appointments', 'nav.appointments', CalendarDays],
      ['/chats', 'nav.chats', MessageCircle],
      ['/reviews', 'nav.reviews', Star],
    ],
  },
  {
    title: 'nav.clinical',
    items: [
      ['/appointments', 'nav.encounters', HeartPulse],
      ['/appointments', 'nav.patientRecords', UsersRound],
    ],
  },
  {
    title: 'nav.system',
    items: [
      ['/settings', 'nav.settings', Settings],
      ['/account', 'nav.account', UserCircle],
    ],
  },
] as const


function getNavLabel(t: ReturnType<typeof useTranslation>['t'], key: string) {
  const fallback: Record<string, string> = {
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.locations': 'Locations',
    'nav.departments': 'Departments',
    'nav.doctors': 'Doctors',
    'nav.appointments': 'Appointments',
    'nav.chats': 'Chats',
    'nav.reviews': 'Reviews',
    'nav.encounters': 'Encounters',
    'nav.patientRecords': 'Patient Records',
    'nav.settings': 'Settings',
    'nav.account': 'Account',
  }

  return t(key, { defaultValue: fallback[key] || key })
}

function NavItems({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  const location = useLocation()
  const unreadChats = useHospitalChatUnreadCount()
  const unreadChatCount = unreadChats.data || 0

  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="px-3 text-xs font-black uppercase tracking-wider text-slate-400">
            {t(group.title)}
          </p>

          {group.items.map(([to, key, Icon]) => {
            const active =
              location.pathname === to ||
              (to !== '/dashboard' && location.pathname.startsWith(to))

            const showUnread = key === 'nav.chats' && unreadChatCount > 0

            return (
              <Link
                key={`${group.title}-${key}`}
                to={to}
                onClick={onClick}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition',
                  active
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{getNavLabel(t, key)}</span>

                  {showUnread ? (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">
                      {unreadChatCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const hospital = useAuthStore((state) => state.hospital)

  return (
    <Link
      to="/dashboard"
      className={cn(
        'flex items-center gap-3 rounded-3xl',
        compact
          ? 'min-w-0 flex-1 p-1'
          : 'mb-6 p-3 hover:bg-white/40 dark:hover:bg-white/5'
      )}
    >
      <HospitalLogo
        name={hospital?.name}
        logoUrl={hospital?.logoUrl}
        size={compact ? 'sm' : 'md'}
      />

      <div className="min-w-0">
        <p className="truncate font-black dark:text-white">careOS</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {hospital?.name || t('app.name')}
        </p>
      </div>
    </Link>
  )
}

export function HospitalShell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const clearSession = useAuthStore((state) => state.clearSession)
  const hospital = useAuthStore((state) => state.hospital)

  return (
    <div className="liquid-bg min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/50 bg-white/70 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 lg:flex">
        <BrandBlock />

        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          <NavItems />
        </nav>

        <button
          type="button"
          onClick={clearSession}
          className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-rose-600 hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </aside>

      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/50 bg-white/85 px-3 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 lg:hidden">
        <Button
          variant="secondary"
          aria-label={t('nav.openMenu')}
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <BrandBlock compact />

        <NotificationBell />
        <ThemeToggle />
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
          />

          <aside className="relative z-10 flex h-full w-[min(88vw,360px)] flex-col rounded-r-[2rem] border-r border-white/40 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <BrandBlock compact />

              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                aria-label={t('nav.closeMenu')}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-2">
              <LanguageSwitcher />
              <NotificationBell />
              <ThemeToggle />
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
              <NavItems onClick={() => setOpen(false)} />
            </nav>

            <Button className="mt-5 w-full" variant="danger" onClick={clearSession}>
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen px-4 py-5 sm:px-5 lg:ml-72 lg:px-8 lg:py-6">
        <div className="mb-6 hidden items-center justify-end gap-3 lg:flex">
          <NotificationBell />
          <LanguageSwitcher />
          <ThemeToggle />

          <span className="soft flex max-w-xs items-center gap-2 rounded-2xl px-4 py-2 text-sm dark:text-white">
            <HospitalLogo
              name={hospital?.name}
              logoUrl={hospital?.logoUrl}
              size="sm"
            />
            <span className="truncate">{hospital?.name}</span>
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}