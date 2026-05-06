import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GlassCard } from '../../components/common/Basic'
import { Button } from '../../components/ui/Button'
export function UnauthorizedPage() { const { t } = useTranslation(); return <main className="liquid-bg flex min-h-screen items-center justify-center p-4"><GlassCard className="max-w-md text-center"><h1 className="text-3xl font-black dark:text-white">{t('auth.unauthorized')}</h1><p className="mt-2 text-slate-600 dark:text-slate-300">{t('auth.unauthorizedMessage')}</p><Link to="/login"><Button className="mt-6">{t('auth.login')}</Button></Link></GlassCard></main> }
