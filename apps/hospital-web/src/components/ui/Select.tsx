import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-11 w-full rounded-2xl border border-white/60 bg-white/70 px-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-white', className)} {...props}>{children}</select>
}
