import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { GlassCard } from './GlassCard'
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return <GlassCard className="flex flex-col items-center justify-center py-12 text-center"><AlertTriangle className="mb-3 text-danger" /><h3 className="font-semibold">{t('common.error')}</h3><p className="mt-1 text-sm text-muted">{message}</p>{onRetry ? <Button className="mt-4" onClick={onRetry}>{t('common.retry')}</Button> : null}</GlassCard>
}
