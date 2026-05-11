import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/authStore'
import { Button } from '../ui/Button'

function getInitialTheme() {
  return localStorage.getItem('careos-lab-theme') || 'light'
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const lab = useAuthStore((state) => state.lab)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('careos-lab-theme', theme)
  }, [theme])

  return (
    <header className="sticky top-0 z-30 mb-6 rounded-b-3xl border-b border-white/60 bg-slate-50/80 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="rounded-2xl p-2 text-slate-600 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10 lg:hidden" onClick={onOpenMobileNav}>
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">{lab?.name || 'Lab workspace'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearSession()
              navigate('/login', { replace: true })
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
