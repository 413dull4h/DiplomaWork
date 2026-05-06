import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../features/auth/authStore'
import { CareOSMark } from '../brand/CareOSMark'
import { LanguageSwitcher } from './LanguageSwitcher'
import { languageCopy, useLanguageStore } from '../../features/settings/languageStore'

const mobileItems = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/appointments', key: 'appointments' },
  { to: '/profile', key: 'profile' },
  { to: '/schedule', key: 'schedule' },
  { to: '/settings', key: 'settings' },
] as const

export function Topbar() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)
  const language = useLanguageStore((state) => state.language)
  const copy = languageCopy[language]

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/dashboard" className="lg:hidden">
          <CareOSMark size="sm" label="careOS" subtitle="" />
        </Link>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{session?.doctor.fullName ?? 'Doctor'}</p>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{session?.hospital.name ?? 'careOS Hospital'}{session?.department?.name ? ` • ${session.department.name}` : ''}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <LanguageSwitcher compact />
          <Button type="button" variant="ghost" onClick={logout}>
            {copy.logout}
          </Button>
        </div>
      </div>

      <nav className="mt-3 grid grid-cols-5 gap-1 lg:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'rounded-2xl px-2 py-2 text-center text-[10px] font-black transition sm:text-xs',
                isActive
                  ? 'bg-blue-600 text-white shadow-soft'
                  : 'bg-white/70 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300',
              )
            }
          >
            {copy[item.key]}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
