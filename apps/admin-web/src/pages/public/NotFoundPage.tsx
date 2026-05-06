import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GlassCard } from '@/components/common/GlassCard'
import { Button } from '@/components/ui/Button'
export function NotFoundPage() { const { t } = useTranslation(); return <main className="grid min-h-screen place-items-center p-4"><GlassCard className="max-w-md text-center"><h1 className="text-3xl font-black">404</h1><p className="mt-2 text-muted">{t('common.notFound')}</p><Link to="/dashboard"><Button className="mt-6">{t('common.goDashboard')}</Button></Link></GlassCard></main> }
