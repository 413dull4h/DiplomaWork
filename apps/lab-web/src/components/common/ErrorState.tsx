import { AlertTriangle } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { Button } from '../ui/Button'

export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 text-rose-700 dark:text-rose-200">
        <AlertTriangle className="h-6 w-6" />
        <div>
          <h3 className="font-black">Unable to load this section</h3>
          <p className="mt-1 text-sm">{message}</p>
        </div>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry} className="w-fit">
            Try again
          </Button>
        ) : null}
      </div>
    </GlassCard>
  )
}
