import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const links = ['/dashboard', '/hospitals', '/appointments', '/audit-logs', '/settings', '/account']
const keys = ['nav.dashboard', 'nav.hospitals', 'nav.appointments', 'nav.auditLogs', 'nav.settings', 'nav.account']

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return <>
    <Button className="lg:hidden" variant="secondary" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></Button>
    {open ? <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
      <div className="glass-surface h-full max-w-xs rounded-glass p-4" onClick={(e) => e.stopPropagation()}>
        <p className="mb-6 px-2 text-lg font-black">{t('app.name')}</p>
        <nav className="space-y-2">{links.map((link, i) => <NavLink onClick={() => setOpen(false)} key={link} to={link} className={({ isActive }) => cn('block rounded-2xl px-4 py-3 text-sm font-semibold', isActive ? 'bg-primary text-white' : 'text-muted hover:bg-white/50 dark:hover:bg-white/10')}>{t(keys[i])}</NavLink>)}</nav>
      </div>
    </div> : null}
  </>
}
