import { ArrowUpRight } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { formatNumber } from '@/utils/format'

export function StatCard({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' }) {
  const tones = { blue: 'from-sky-500/20 to-cyan-500/10 text-sky-500', emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-500', amber: 'from-amber-500/20 to-orange-500/10 text-amber-500', red: 'from-red-500/20 to-rose-500/10 text-red-500', slate: 'from-slate-500/15 to-slate-500/5 text-slate-500' }
  return <GlassCard className="relative overflow-hidden">
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tones[tone]}`} />
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight">{formatNumber(value)}</p>
      </div>
      <span className={`rounded-2xl bg-gradient-to-br p-2 ${tones[tone]}`}><ArrowUpRight size={18} /></span>
    </div>
  </GlassCard>
}
