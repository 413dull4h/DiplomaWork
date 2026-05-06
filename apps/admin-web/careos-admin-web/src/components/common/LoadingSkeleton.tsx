export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-3xl bg-white/50 dark:bg-white/10" />)}</div>
}
