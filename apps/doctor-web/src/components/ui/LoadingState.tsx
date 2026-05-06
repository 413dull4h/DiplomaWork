export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-soft dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        {label}
      </div>
    </div>
  )
}
