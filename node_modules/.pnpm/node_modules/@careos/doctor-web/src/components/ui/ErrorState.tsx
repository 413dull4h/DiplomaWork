import { Card } from './Card'
import { Button } from './Button'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30">
      <h3 className="text-base font-bold text-rose-900 dark:text-rose-100">{title}</h3>
      <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  )
}
