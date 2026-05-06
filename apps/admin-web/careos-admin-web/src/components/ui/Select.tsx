import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary dark:bg-slate-900/55', className)} {...props}>{children}</select>
}
