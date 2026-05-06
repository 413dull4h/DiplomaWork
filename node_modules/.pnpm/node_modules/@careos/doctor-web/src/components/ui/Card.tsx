import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  glass?: boolean
  elevated?: boolean
}

export function Card({ children, className, glass = false, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80',
        glass && 'glass-panel shadow-glass',
        elevated && 'shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
