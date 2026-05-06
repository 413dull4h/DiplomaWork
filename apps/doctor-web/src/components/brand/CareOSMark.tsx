import clsx from 'clsx'

type CareOSMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  subtitle?: string
  className?: string
}

const sizes = {
  sm: 'h-10 w-10 rounded-2xl text-base',
  md: 'h-12 w-12 rounded-2xl text-lg',
  lg: 'h-16 w-16 rounded-3xl text-2xl',
}

export function CareOSMark({ size = 'md', label = 'careOS', subtitle = 'Doctor Portal', className }: CareOSMarkProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div
        className={clsx(
          'relative flex shrink-0 items-center justify-center overflow-hidden bg-blue-600 font-black text-white shadow-lift',
          sizes[size],
        )}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_30%)]" />
        <span className="relative">c</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">{label}</p>
        <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}
