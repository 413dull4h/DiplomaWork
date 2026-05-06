import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { GlassCard } from '@/components/common/GlassCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/format'

export function AccountPage() {
  const { t } = useTranslation(); const navigate = useNavigate(); const user = useAuthStore((s) => s.user); const clearSession = useAuthStore((s) => s.clearSession)
  const logout = () => { clearSession(); navigate('/login') }
  return <div><PageHeader title={t('nav.account')} subtitle={t('auth.session')} /><GlassCard className="max-w-2xl"><dl className="grid gap-4 md:grid-cols-2"><Info label={t('auth.email')} value={user?.email} /><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('common.status')}</dt><dd className="mt-1"><StatusBadge status={user?.status} /></dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('audit.role')}</dt><dd className="mt-1"><StatusBadge status={user?.primaryRole} /></dd></div><Info label={t('common.created')} value={formatDateTime(user?.createdAt)} /><Info label="ID" value={user?.id} /></dl><Button className="mt-6" variant="danger" onClick={logout}>{t('nav.logout')}</Button></GlassCard></div>
}
function Info({ label, value }: { label: string; value?: string | null }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 font-semibold break-all">{value || '—'}</dd></div> }
