import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-28 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white', className)} {...props} />
}
