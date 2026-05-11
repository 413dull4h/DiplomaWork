import type { ReactNode } from 'react'

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 ${className}`}
    >
      {children}
    </section>
  )
}
