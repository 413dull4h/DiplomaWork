import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { MobileNav } from './MobileNav'

export function TopNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const logout = () => { clearSession(); navigate('/login', { replace: true }) }
  return <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/20 bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
    <div className="flex items-center gap-2"><MobileNav /><div><p className="text-sm font-bold">{user?.email}</p><p className="text-xs text-muted">{user?.primaryRole}</p></div></div>
    <div className="flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /><Button variant="secondary" onClick={logout}><LogOut size={16} />{t('nav.logout')}</Button></div>
  </header>
}
