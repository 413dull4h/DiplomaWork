import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

export function Button({ className, variant = 'primary', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  const variants: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:opacity-90 shadow-glow',
    secondary: 'bg-white/60 dark:bg-slate-800/70 text-foreground border border-border hover:bg-white/80 dark:hover:bg-slate-800',
    ghost: 'bg-transparent hover:bg-white/40 dark:hover:bg-white/10 text-foreground',
    danger: 'bg-danger text-white hover:opacity-90',
    success: 'bg-success text-white hover:opacity-90',
  }
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)} {...props}>{children}</button>
}
