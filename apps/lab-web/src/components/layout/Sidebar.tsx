import { NavLink } from 'react-router-dom'
import { Bell, FlaskConical, Home, ClipboardList, Settings, TestTube2, UserRound, FileText } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/tests', label: 'Tests', icon: TestTube2 },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-600 p-3 text-white shadow-lg shadow-cyan-600/20">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">careOS Lab</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Diagnostic Center</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
