import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { CareOSMark } from '../brand/CareOSMark'
import { languageCopy, useLanguageStore } from '../../features/settings/languageStore'

const navItems = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/appointments', key: 'appointments' },
  { to: '/profile', key: 'profile' },
  { to: '/profile/edit', key: 'editProfile' },
  { to: '/schedule', key: 'schedule' },
  { to: '/settings', key: 'settings' },
] as const

export function Sidebar() {
  const language = useLanguageStore((state) => state.language)
  const copy = languageCopy[language]

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/60 bg-white/60 p-5 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/60 lg:block">
      <div className="mb-8 rounded-3xl border border-white/70 bg-white/60 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/45">
        <CareOSMark />
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition',
                isActive
                  ? 'bg-blue-600 text-white shadow-lift'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-900/80 dark:hover:text-white',
              )
            }
          >
            <span>{copy[item.key]}</span>
            <span className="text-xs opacity-50">›</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
        Hospital-scoped doctor access. Patient data is only available through assigned appointments and encounters.
      </div>
    </aside>
  )
}
