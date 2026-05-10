import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  Menu,
  Search,
  Settings,
  Star,
  UserCircle,
  Users,
  X,
  HeartPulse,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const navGroups = [
  {
    title: 'Main',
    items: [
      {
        to: '/dashboard',
        key: 'nav.dashboard',
        fallback: 'Dashboard',
        icon: Home,
      },
      {
        to: '/hospitals',
        key: 'nav.hospitals',
        fallback: 'Hospitals',
        icon: Building2,
      },
      {
        to: '/users',
        key: 'nav.users',
        fallback: 'Users',
        icon: Users,
      },
      {
        to: '/patients',
        key: 'nav.patients',
        fallback: 'Patients',
        icon: HeartPulse,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        to: '/appointments',
        key: 'nav.appointments',
        fallback: 'Appointments',
        icon: CalendarDays,
      },
      {
        to: '/reviews',
        key: 'nav.reviews',
        fallback: 'Reviews',
        icon: Star,
      },
      {
        to: '/audit-logs',
        key: 'nav.auditLogs',
        fallback: 'Audit Logs',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        to: '/settings',
        key: 'nav.settings',
        fallback: 'Settings',
        icon: Settings,
      },
      {
        to: '/account',
        key: 'nav.account',
        fallback: 'Account',
        icon: UserCircle,
      },
    ],
  },
] as const

const bottomLinks = [
  {
    to: '/dashboard',
    key: 'nav.dashboard',
    fallback: 'Home',
    icon: Home,
  },
  {
    to: '/hospitals',
    key: 'nav.hospitals',
    fallback: 'Hospitals',
    icon: Building2,
  },
  {
    to: '/appointments',
    key: 'nav.appointments',
    fallback: 'Visits',
    icon: CalendarDays,
  },
  {
    to: '/reviews',
    key: 'nav.reviews',
    fallback: 'Reviews',
    icon: Star,
  },
] as const

function isActivePath(pathname: string, to: string) {
  return pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const location = useLocation()

  const currentPage = useMemo(() => {
    const allItems = navGroups.flatMap((group) => group.items)
    const match = allItems.find((item) => isActivePath(location.pathname, item.to))
    return match ? t(match.key, match.fallback) : t('app.name')
  }, [location.pathname, t])

  return (
    <>
      <Button
        className="lg:hidden"
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-3 right-3 top-3 max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-white shadow-glow">
                  <Activity size={20} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">
                    {t('app.name')}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {currentPage}
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-4">
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
                <Search size={18} />
                <span className="text-sm">Navigate admin modules</span>
              </div>

              <nav className="space-y-6 pb-4">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {group.title}
                    </p>

                    <div className="grid gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = isActivePath(location.pathname, item.to)

                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition',
                              active
                                ? 'bg-primary text-white shadow-glow'
                                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                                active ? 'bg-white/20' : 'bg-white/5'
                              )}
                            >
                              <Icon size={18} />
                            </span>

                            <span className="truncate">
                              {t(item.key, item.fallback)}
                            </span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      ) : null}

      <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-[1.75rem] border border-white/15 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {bottomLinks.map((item) => {
            const Icon = item.icon
            const active = isActivePath(location.pathname, item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition',
                  active
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={18} />
                <span className="max-w-full truncate">
                  {t(item.key, item.fallback)}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}