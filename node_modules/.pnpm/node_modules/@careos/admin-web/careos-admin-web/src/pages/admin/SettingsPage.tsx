import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { GlassCard } from '@/components/common/GlassCard'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useHealth } from '@/hooks/useHealth'
import { formatDateTime } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function SettingsPage() {
  const { t } = useTranslation(); const health = useHealth(); const user = useAuthStore((s) => s.user); const clearSession = useAuthStore((s) => s.clearSession); const navigate = useNavigate()
  const logout = () => { clearSession(); navigate('/login') }
  return <div><PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} /><div className="grid gap-5 lg:grid-cols-2"><GlassCard><h2 className="mb-4 text-xl font-bold">{t('settings.theme')}</h2><ThemeToggle /></GlassCard><GlassCard><h2 className="mb-4 text-xl font-bold">{t('settings.language')}</h2><LanguageSwitcher /></GlassCard><GlassCard><h2 className="mb-4 text-xl font-bold">{t('settings.apiStatus')}</h2>{health.isLoading ? <p className="text-muted">{t('common.loading')}</p> : health.isError ? <StatusBadge status="SUSPENDED" /> : <div className="space-y-2"><StatusBadge status="ACTIVE" /><p className="text-sm text-muted">{health.data?.service}</p><p className="text-sm text-muted">{formatDateTime(health.data?.timestamp)}</p></div>}</GlassCard><GlassCard><h2 className="mb-4 text-xl font-bold">{t('auth.session')}</h2><p className="font-semibold">{user?.email}</p><p className="text-sm text-muted">{user?.primaryRole}</p><Button className="mt-4" variant="danger" onClick={logout}>{t('nav.logout')}</Button></GlassCard><GlassCard><h2 className="mb-2 text-xl font-bold">{t('settings.securityPlaceholder')}</h2><p className="text-sm text-muted">{t('common.future')}</p></GlassCard><GlassCard><h2 className="mb-2 text-xl font-bold">{t('settings.platformPlaceholder')}</h2><p className="text-sm text-muted">{t('common.future')}</p></GlassCard></div></div>
}
