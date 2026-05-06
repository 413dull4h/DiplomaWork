import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation()
  const value = status || 'INACTIVE'
  const styles: Record<string, string> = {
    APPROVED: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/30',
    ACTIVE: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/30',
    COMPLETED: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/30',
    CONFIRMED: 'bg-sky-500/12 text-sky-600 border-sky-500/30',
    PENDING: 'bg-amber-500/12 text-amber-600 border-amber-500/30',
    REQUESTED: 'bg-amber-500/12 text-amber-600 border-amber-500/30',
    SUSPENDED: 'bg-red-500/12 text-red-600 border-red-500/30',
    REJECTED: 'bg-red-500/12 text-red-600 border-red-500/30',
    CANCELLED: 'bg-red-500/12 text-red-600 border-red-500/30',
    NO_SHOW: 'bg-slate-500/12 text-slate-600 border-slate-500/30',
    INACTIVE: 'bg-slate-500/12 text-slate-600 border-slate-500/30',
  }
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', styles[value] ?? styles.INACTIVE)}>{t(`status.${value}`, value)}</span>
}
