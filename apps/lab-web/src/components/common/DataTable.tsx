import type { ReactNode } from 'react'

export function DataTable({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-soft dark:border-white/10 dark:bg-slate-900/70">{children}</div>
}
