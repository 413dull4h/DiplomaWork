import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-28 w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-primary dark:bg-slate-900/55', className)} {...props} />
}
