import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Building2, Inbox } from 'lucide-react'
import { cn } from '../../utils/cn'
import { fmtDateTime, initials } from '../../utils/format'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('glass rounded-3xl p-5', className)}>{children}</motion.div>
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-3xl font-black text-slate-950 dark:text-white">{title}</h1>{subtitle && <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>}</div><div className="flex flex-wrap gap-2">{actions}</div></div>
}
const badge: Record<string, string> = { APPROVED:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', ACTIVE:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', COMPLETED:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', CONFIRMED:'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300', REQUESTED:'bg-amber-500/15 text-amber-700 dark:text-amber-300', PENDING:'bg-amber-500/15 text-amber-700 dark:text-amber-300', SUSPENDED:'bg-rose-500/15 text-rose-700 dark:text-rose-300', REJECTED:'bg-rose-500/15 text-rose-700 dark:text-rose-300', CANCELLED:'bg-rose-500/15 text-rose-700 dark:text-rose-300', NO_SHOW:'bg-slate-500/15 text-slate-700 dark:text-slate-300', IN_PERSON:'bg-blue-500/15 text-blue-700 dark:text-blue-300', TELECONSULT:'bg-violet-500/15 text-violet-700 dark:text-violet-300', BOTH:'bg-teal-500/15 text-teal-700 dark:text-teal-300' }
export function StatusBadge({ value }: { value?: string | null }) { const { t } = useTranslation(); if (!value) return <span>—</span>; return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-current/10', badge[value] || 'bg-slate-500/15 text-slate-700 dark:text-slate-300')}>{t(`status.${value}`, value)}</span> }
export function LoadingSkeleton({ rows = 4 }: { rows?: number }) { return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/55 dark:bg-white/[0.06]" />)}</div> }
export function EmptyState({ title }: { title: string }) { return <GlassCard className="py-12 text-center"><Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" /><p className="font-bold text-slate-950 dark:text-white">{title}</p></GlassCard> }
export function ErrorState({ message }: { message?: string }) { const { t } = useTranslation(); return <GlassCard className="py-12 text-center"><AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" /><p className="font-bold text-slate-950 dark:text-white">{message || t('common.error')}</p></GlassCard> }
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>{children}{error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}</label> }
export function BackButton() { const nav = useNavigate(); const { t } = useTranslation(); return <Button variant="secondary" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4" />{t('common.back')}</Button> }
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) { return <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> }
export function DateTime({ value }: { value?: string | null }) { const { i18n } = useTranslation(); return <span>{fmtDateTime(value, i18n.language)}</span> }
export function TimeRange({ start, end }: { start?: string | null; end?: string | null }) { return <span><DateTime value={start} /> → <DateTime value={end} /></span> }
export function HospitalAvatar({ name, size = 'lg' }: { name?: string | null; size?: 'md' | 'lg' | 'xl' }) { const s = { md:'h-14 w-14 text-base', lg:'h-20 w-20 text-xl', xl:'h-28 w-28 text-3xl' }[size]; return <div className={cn('relative flex shrink-0 items-center justify-center rounded-3xl border border-white/60 bg-gradient-to-br from-cyan-500/25 to-emerald-500/20 font-black text-cyan-700 shadow-glass dark:border-white/10 dark:text-cyan-200', s)} aria-label={name ? `${name} logo` : 'Hospital logo'}>{initials(name)}<Building2 className="absolute bottom-2 right-2 h-4 w-4 opacity-45" /></div> }
export function ActionLink({ to, label }: { to: string; label: string }) { return <Link to={to}><Button variant="secondary">{label}</Button></Link> }
export function Err({ e }: { e: unknown }) { return <p className="text-sm text-rose-600">{e instanceof Error ? e.message : 'Request failed.'}</p> }
