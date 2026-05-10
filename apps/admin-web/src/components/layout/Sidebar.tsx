import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Star,
  UserCircle,
  Users,
  HeartPulse,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'

const items = [
  { to: '/dashboard', key: 'nav.dashboard', fallback: 'Dashboard', icon: LayoutDashboard },
  { to: '/hospitals', key: 'nav.hospitals', fallback: 'Hospitals', icon: Building2 },
  { to: '/users', key: 'nav.users', fallback: 'Users', icon: Users },
  { to: '/patients', key: 'nav.patients', fallback: 'Patients', icon: HeartPulse },
  { to: '/appointments', key: 'nav.appointments', fallback: 'Appointments', icon: CalendarDays },
  { to: '/reviews', key: 'nav.reviews', fallback: 'Reviews', icon: Star },
  { to: '/audit-logs', key: 'nav.auditLogs', fallback: 'Audit Logs', icon: ClipboardList },
  { to: '/settings', key: 'nav.settings', fallback: 'Settings', icon: Settings },
  { to: '/account', key: 'nav.account', fallback: 'Account', icon: UserCircle },
]

export function Sidebar() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-4 lg:block">
      <div className="glass-surface flex h-full flex-col rounded-glass p-4">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-white shadow-glow">
            <Activity />
          </div>

          <div>
            <p className="text-lg font-black tracking-tight">{t('app.name')}</p>
            <p className="text-xs text-muted">{t('app.tagline')}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map(({ to, key, fallback, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-muted hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10'
                )
              }
            >
              <Icon size={18} />
              {t(key, fallback)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/40 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <Avatar email={user?.email} imageUrl={user?.avatarUrl} size="md" />

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-foreground">
                {user?.email || 'Admin'}
              </p>
              <p className="truncate text-xs text-muted">
                {user?.primaryRole || 'PLATFORM_ADMIN'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}