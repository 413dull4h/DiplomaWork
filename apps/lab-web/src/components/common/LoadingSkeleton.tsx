export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-3xl bg-white/70 dark:bg-white/10" />
      ))}
    </div>
  )
}
