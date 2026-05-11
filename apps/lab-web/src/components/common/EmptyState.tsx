import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <GlassCard className="text-center">
      <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
      {message ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </GlassCard>
  )
}
