import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Building2, CalendarDays, ClipboardList, HeartPulse, LayoutDashboard, LogOut, Menu, Settings, Stethoscope, UserCircle, UsersRound, X } from 'lucide-react'
import { languages } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  return <Select aria-label="Language" value={i18n.language} onChange={e => void i18n.changeLanguage(e.target.value)} className="w-36">{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</Select>
}
export function ThemeToggle() { const t = useThemeStore(s => s.theme), toggle = useThemeStore(s => s.toggleTheme); return <Button variant="secondary" onClick={toggle} aria-label="Toggle theme">{t === 'dark' ? '☀️' : '🌙'}</Button> }
const groups = [
  { title:'nav.overview', items:[['/dashboard','nav.dashboard',LayoutDashboard],['/profile','nav.profile',Building2]] },
  { title:'nav.operations', items:[['/departments','nav.departments',ClipboardList],['/doctors','nav.doctors',Stethoscope],['/appointments','nav.appointments',CalendarDays]] },
  { title:'nav.clinical', items:[['/appointments','nav.encounters',HeartPulse],['/appointments','nav.patientRecords',UsersRound]] },
  { title:'nav.system', items:[['/settings','nav.settings',Settings],['/account','nav.account',UserCircle]] },
] as const
function NavItems({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation(), loc = useLocation()
  return <>{groups.map(g => <div key={g.title} className="space-y-2"><p className="px-3 text-xs font-black uppercase tracking-wider text-slate-400">{t(g.title)}</p>{g.items.map(([to,key,Icon]) => { const active = loc.pathname === to || (to !== '/dashboard' && loc.pathname.startsWith(to)); return <Link key={key} to={to} onClick={onClick} className={cn('flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition', active ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10')}><Icon className="h-4 w-4" />{t(key)}</Link> })}</div>)}</>
}
export function HospitalShell() {
  const { t } = useTranslation(); const [open,setOpen] = useState(false); const clear = useAuthStore(s => s.clearSession); const hospital = useAuthStore(s => s.hospital)
  return <div className="liquid-bg min-h-screen"><aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/50 bg-white/50 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45 lg:flex"><Link to="/dashboard" className="mb-6 flex items-center gap-3 rounded-3xl p-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white"><Activity className="h-5 w-5" /></div><div><p className="font-black dark:text-white">careOS</p><p className="max-w-44 truncate text-xs text-slate-500">{hospital?.name || t('app.name')}</p></div></Link><nav className="flex-1 space-y-5 overflow-y-auto pr-1"><NavItems /></nav><button onClick={clear} className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-rose-600 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />{t('nav.logout')}</button></aside><header className="sticky top-0 z-40 flex items-center gap-2 border-b border-white/50 bg-white/65 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 lg:hidden"><Button variant="secondary" aria-label={t('nav.openMenu')} onClick={() => setOpen(true)}><Menu /></Button><div className="min-w-0 flex-1"><p className="truncate text-sm font-black dark:text-white">{hospital?.name || t('app.name')}</p></div><LanguageSwitcher /><ThemeToggle /></header>{open && <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm lg:hidden" onMouseDown={() => setOpen(false)}><aside className="glass h-full w-[min(92vw,360px)] overflow-y-auto rounded-r-3xl p-4" onMouseDown={e => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><b className="dark:text-white">careOS</b><Button variant="secondary" onClick={() => setOpen(false)} aria-label={t('nav.closeMenu')}><X /></Button></div><nav className="space-y-5"><NavItems onClick={() => setOpen(false)} /></nav><Button className="mt-6 w-full" variant="danger" onClick={clear}>{t('nav.logout')}</Button></aside></div>}<main className="min-h-screen px-4 py-6 lg:ml-72 lg:px-8"><div className="mb-6 hidden items-center justify-end gap-3 lg:flex"><LanguageSwitcher /><ThemeToggle /><span className="soft rounded-2xl px-4 py-2 text-sm dark:text-white">{hospital?.name}</span></div><Outlet /></main></div>
}
