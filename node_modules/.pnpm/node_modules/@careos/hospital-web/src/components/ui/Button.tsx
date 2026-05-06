import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
const styles: Record<Variant, string> = {
  primary: 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20',
  secondary: 'soft text-slate-900 hover:bg-white/75 dark:text-white dark:hover:bg-white/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10',
}
export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', styles[variant], className)} {...props} />
}
