import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GlassCard } from '@/components/common/GlassCard'
import { Button } from '@/components/ui/Button'
export function UnauthorizedPage() { const { t } = useTranslation(); return <main className="grid min-h-screen place-items-center p-4"><GlassCard className="max-w-md text-center"><h1 className="text-3xl font-black">{t('auth.unauthorized')}</h1><p className="mt-2 text-muted">{t('auth.unauthorizedDesc')}</p><Link to="/login"><Button className="mt-6">{t('auth.signInButton')}</Button></Link></GlassCard></main> }
