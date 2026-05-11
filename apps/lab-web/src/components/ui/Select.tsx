import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
