import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog({ open, title, onCancel, onConfirm, loading }: { open: boolean; title: string; onCancel: () => void; onConfirm: () => void; loading?: boolean }) {
  const { t } = useTranslation()
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
    <div className="glass-surface w-full max-w-md rounded-glass p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button><Button variant="danger" disabled={loading} onClick={onConfirm}>{t('common.confirm')}</Button></div>
    </div>
  </div>
}
