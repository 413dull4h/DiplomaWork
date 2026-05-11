import { Badge } from '../ui/Badge'
import { titleCase } from '../../utils/format'

const colorMap: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
  ACCEPTED: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
  SCHEDULED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200',
  SAMPLE_COLLECTED: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  MISSED: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-200',
  FINAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  CORRECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
}

export function StatusBadge({ value }: { value?: string | null }) {
  const key = value || 'UNKNOWN'
  return <Badge className={colorMap[key] || 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white'}>{titleCase(key)}</Badge>
}
