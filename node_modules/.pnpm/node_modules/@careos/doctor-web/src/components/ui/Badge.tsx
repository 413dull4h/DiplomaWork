import type { ReactNode } from 'react'
import clsx from 'clsx'

type BadgeTone = 'blue' | 'green' | 'amber' | 'slate' | 'rose'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const tones: Record<BadgeTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20',
}

export function Badge({ children, tone = 'slate', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  )
}
