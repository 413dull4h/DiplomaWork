import { Activity, Building2, CalendarDays, ClipboardList, LayoutDashboard, Settings, UserCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

const items = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/hospitals', key: 'nav.hospitals', icon: Building2 },
  { to: '/appointments', key: 'nav.appointments', icon: CalendarDays },
  { to: '/audit-logs', key: 'nav.auditLogs', icon: ClipboardList },
  { to: '/settings', key: 'nav.settings', icon: Settings },
  { to: '/account', key: 'nav.account', icon: UserCircle },
]

export function Sidebar() {
  const { t } = useTranslation()
  return <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-4 lg:block">
    <div className="glass-surface flex h-full flex-col rounded-glass p-4">
      <div className="mb-8 flex items-center gap-3 px-2 pt-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-white shadow-glow"><Activity /></div>
        <div><p className="text-lg font-black tracking-tight">{t('app.name')}</p><p className="text-xs text-muted">{t('app.tagline')}</p></div>
      </div>
      <nav className="space-y-2">
        {items.map(({ to, key, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition', isActive ? 'bg-primary text-white shadow-glow' : 'text-muted hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10')}><Icon size={18} />{t(key)}</NavLink>)}
      </nav>
    </div>
  </aside>
}
